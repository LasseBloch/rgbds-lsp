import Parser from 'tree-sitter';
import { InstructionForm } from './instructions';

export const REGISTERS_8 = new Set(['a', 'b', 'c', 'd', 'e', 'h', 'l']);
export const REGISTERS_16 = new Set(['bc', 'de', 'hl']);

export function matchInstructionForm(instrNode: Parser.SyntaxNode, forms: InstructionForm[]): InstructionForm | null {
    // Build a pattern string from the AST operands like "r8, [hl]" or "a, n8"
    const operandList = instrNode.children.find(c => c.type === 'operand_list');
    if (!operandList) {
        // No operands — match the bare mnemonic form
        return forms.find(f => !f.label.includes(' ') || f.label.split(' ').length === 1) || null;
    }

    const operands = operandList.children.filter(c => c.type === 'operand');
    const patterns: string[] = [];

    for (const op of operands) {
        patterns.push(classifyOperand(op));
    }

    const mnemonic = instrNode.children.find(c => c.type === 'mnemonic')?.text.toLowerCase() || '';
    const pattern = `${mnemonic} ${patterns.join(', ')}`;

    // Try exact match first, then fuzzy
    return forms.find(f => f.label === pattern)
        || forms.find(f => fuzzyFormMatch(f.label, mnemonic, patterns))
        || null;
}

function classifyOperand(op: Parser.SyntaxNode): string {
    const child = op.children[0] || op;

    if (child.type === 'register') {
        const reg = child.text.toLowerCase();
        if (REGISTERS_8.has(reg)) return reg === 'a' ? 'a' : 'r8';
        if (REGISTERS_16.has(reg)) return reg === 'hl' ? 'hl' : 'r16';
        return reg;
    }
    if (child.type === 'sp_register') return 'sp';
    if (child.type === 'sp_offset') return 'sp+e8';
    if (child.type === 'condition') return 'cc';
    if (child.type === 'memory_operand') {
        // [hl], [hli], [hld], [bc], [de], [c], [n16]
        const inner = child.children.find(c => c.type !== '[' && c.type !== ']' && c.text !== '[' && c.text !== ']');
        if (!inner) return '[n16]';
        const txt = child.text.replace(/\s+/g, '').toLowerCase();
        if (txt === '[hl]') return '[hl]';
        // [hli]/[hld] are the canonical RGBDS spellings; [hl+]/[hl-] are the alternates
        if (txt === '[hl+]' || txt === '[hli]') return '[hli]';
        if (txt === '[hl-]' || txt === '[hld]') return '[hld]';
        if (txt === '[c]') return '[c]';
        // [$ff00+c] addresses the same byte as [c], but stays a distinct pattern:
        // `ld [c], a` was removed in RGBDS 1.0.0, so it must match only the ld forms
        if (txt === '[$ff00+c]') return '[$ff00+c]';
        if (inner.type === 'register') {
            const reg = inner.text.toLowerCase();
            if (REGISTERS_16.has(reg)) return `[${reg === 'hl' ? 'hl' : 'r16'}]`;
            return `[${reg}]`;
        }
        return '[n16]';
    }
    // Expression — could be n8, n16, e8, u3
    return 'n8';
}

function fuzzyFormMatch(label: string, mnemonic: string, patterns: string[]): boolean {
    if (!label.startsWith(mnemonic + ' ')) return false;
    const formOperands = label.substring(mnemonic.length + 1).split(', ');
    if (formOperands.length !== patterns.length) return false;

    for (let i = 0; i < patterns.length; i++) {
        const p = patterns[i];
        const f = formOperands[i];
        // Direct match
        if (p === f) continue;
        // 'a' matches 'r8', specific register matches generic
        if (f === 'r8' && REGISTERS_8.has(p)) continue;
        if (f === 'r16' && REGISTERS_16.has(p)) continue;
        if (f === 'cc' && ['z', 'nz', 'c', 'nc'].includes(p)) continue;
        if (f === '[r16]' && ['[bc]', '[de]', '[hl]'].includes(p)) continue;
        // n8/n16/e8/u3 all come from expressions
        if (['n8', 'n16', 'e8', 'u3'].includes(f) && p === 'n8') continue;
        if (f === 'sp+e8' && p === 'sp+e8') continue;
        return false;
    }
    return true;
}

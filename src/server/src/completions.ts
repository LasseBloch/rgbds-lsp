import {
    CompletionItem,
    CompletionItemKind,
    InsertTextFormat,
    TextDocumentPositionParams,
} from 'vscode-languageserver/node';
import Parser from 'tree-sitter';
import { Indexer } from './indexer';
import { SM83_INSTRUCTIONS } from './instructions';
import { uriToPath, getNodeAtPosition } from './utils';
import * as path from 'path';
import * as fs from 'fs';

// ─── Static keyword data ─────────────────────────────────────

const REGISTERS: CompletionItem[] = [
    'a', 'b', 'c', 'd', 'e', 'h', 'l',
    'af', 'bc', 'de', 'hl', 'sp',
].map(r => ({
    label: r,
    kind: CompletionItemKind.Keyword,
    detail: 'register',
}));

const CONDITIONS: CompletionItem[] = [
    'z', 'nz', 'c', 'nc',
].map(c => ({
    label: c,
    kind: CompletionItemKind.Keyword,
    detail: 'condition',
}));

const DIRECTIVES: CompletionItem[] = [
    'SECTION', 'LOAD', 'ENDSECTION',
    'DB', 'DW', 'DL', 'DS',
    'EQU', 'EQUS', 'SET', 'DEF', 'REDEF',
    'INCLUDE', 'INCBIN',
    'EXPORT', 'GLOBAL', 'PURGE',
    'MACRO', 'ENDM', 'SHIFT',
    'IF', 'ELIF', 'ELSE', 'ENDC',
    'REPT', 'FOR', 'ENDR', 'BREAK',
    'UNION', 'NEXTU', 'ENDU',
    'CHARMAP', 'NEWCHARMAP', 'SETCHARMAP',
    'PUSHC', 'POPC', 'PUSHS', 'POPS', 'PUSHO', 'POPO',
    'ASSERT', 'STATIC_ASSERT', 'PRINT', 'WARN', 'FAIL',
    'OPT',
    'RSRESET', 'RSSET', 'RB', 'RW', 'RL',
].map(d => ({
    label: d,
    kind: CompletionItemKind.Keyword,
    detail: 'directive',
}));

// Pre-build instruction completion items
const INSTRUCTION_ITEMS: CompletionItem[] = SM83_INSTRUCTIONS.map(instr => ({
    label: instr.label,
    kind: CompletionItemKind.Snippet,
    detail: `${instr.bytes} byte${instr.bytes > 1 ? 's' : ''} | ${instr.cycles} cycles | ${instr.flags}`,
    documentation: instr.description,
    insertText: instr.insertText,
    insertTextFormat: InsertTextFormat.Snippet,
    filterText: instr.mnemonic,
    sortText: `0_${instr.mnemonic}_${instr.label}`,
}));

// ─── Context detection ───────────────────────────────────────

type CompletionContext = 'statement' | 'operand' | 'include_string' | 'general';

function detectContext(tree: Parser.Tree | undefined, line: number, col: number, lineText: string): CompletionContext {
    if (!tree) return 'general';

    const node = getNodeAtPosition(tree, line, col > 0 ? col - 1 : 0);

    // Check if inside an include directive string
    if (isInsideIncludeString(node)) {
        return 'include_string';
    }

    // Check if we're in an operand position (after a mnemonic on the same line)
    let walk: Parser.SyntaxNode | null = node;
    while (walk) {
        if (walk.type === 'instruction' || walk.type === 'operand_list' || walk.type === 'operand') {
            return 'operand';
        }
        if (walk.type === 'line' || walk.type === 'final_line') break;
        walk = walk.parent;
    }

    // Statement position: beginning of line or after label
    const trimmed = lineText.substring(0, col).trimStart();
    if (trimmed === '' || trimmed.endsWith(':') || trimmed.endsWith(':: ') || trimmed.endsWith(': ')) {
        return 'statement';
    }

    return 'general';
}

function isInsideIncludeString(node: Parser.SyntaxNode): boolean {
    let walk: Parser.SyntaxNode | null = node;
    while (walk) {
        if (walk.type === 'include_directive' || walk.type === 'incbin_directive') {
            return true;
        }
        if (walk.type === 'line' || walk.type === 'final_line') break;
        walk = walk.parent;
    }
    return false;
}

// ─── Include path completion ─────────────────────────────────

function getIncludeCompletions(docUri: string, lineText: string, col: number): CompletionItem[] {
    // Extract the partial path from the include string
    const beforeCursor = lineText.substring(0, col);
    const includeMatch = beforeCursor.match(/(?:INCLUDE|INCBIN)\s+(?:#?"{1,3})([^"]*)$/i);
    if (!includeMatch) return [];

    const partial = includeMatch[1];
    const docPath = uriToPath(docUri);
    const docDir = path.dirname(docPath);
    const partialDir = partial.includes('/') || partial.includes('\\')
        ? path.resolve(docDir, path.dirname(partial))
        : docDir;

    const items: CompletionItem[] = [];
    try {
        const entries = fs.readdirSync(partialDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                items.push({
                    label: entry.name + '/',
                    kind: CompletionItemKind.Folder,
                });
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (['.asm', '.inc', '.rgbasm', '.rgbinc', '.bin', '.2bpp', '.1bpp', '.tilemap'].includes(ext)) {
                    items.push({
                        label: entry.name,
                        kind: CompletionItemKind.File,
                    });
                }
            }
        }
    } catch {
        // Directory doesn't exist
    }

    return items;
}

// ─── Symbol completions ──────────────────────────────────────

function getSymbolCompletions(indexer: Indexer): CompletionItem[] {
    const items: CompletionItem[] = [];

    for (const [name, def] of indexer.definitions) {
        let kind: CompletionItemKind = CompletionItemKind.Variable;
        if (def.type === 'label') kind = CompletionItemKind.Function;
        else if (def.type === 'constant') kind = CompletionItemKind.Constant;
        else if (def.type === 'macro') kind = CompletionItemKind.Method;
        else if (def.type === 'section') kind = CompletionItemKind.Module;

        items.push({
            label: name,
            kind,
            detail: `${def.type} — ${path.basename(uriToPath(def.file))}:${def.line + 1}`,
            documentation: def.docComment,
            sortText: `2_${name}`,
        });
    }

    return items;
}

// ─── Main completion function ────────────────────────────────

export function getCompletions(
    params: TextDocumentPositionParams,
    indexer: Indexer,
    lineText: string,
): CompletionItem[] {
    const tree = indexer.getTree(params.textDocument.uri);
    const context = detectContext(tree, params.position.line, params.position.character, lineText);

    switch (context) {
        case 'include_string':
            return getIncludeCompletions(params.textDocument.uri, lineText, params.position.character);

        case 'statement':
            return [
                ...INSTRUCTION_ITEMS,
                ...DIRECTIVES.map(d => ({ ...d, sortText: `1_${d.label}` })),
                ...getSymbolCompletions(indexer),
            ];

        case 'operand':
            return [
                ...REGISTERS,
                ...CONDITIONS,
                ...getSymbolCompletions(indexer),
            ];

        case 'general':
        default:
            return [
                ...INSTRUCTION_ITEMS,
                ...DIRECTIVES.map(d => ({ ...d, sortText: `1_${d.label}` })),
                ...REGISTERS,
                ...CONDITIONS,
                ...getSymbolCompletions(indexer),
            ];
    }
}

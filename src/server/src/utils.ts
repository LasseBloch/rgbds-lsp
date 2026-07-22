import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import Parser from 'tree-sitter';

export function uriToPath(uri: string): string {
    try {
        return fileURLToPath(uri);
    } catch {
        return uri;
    }
}

export function pathToUri(filePath: string): string {
    if (!filePath) return '';
    if (filePath.startsWith('file://')) return filePath;
    if (!path.isAbsolute(filePath)) return filePath;
    return pathToFileURL(filePath).toString();
}

export function getNodeAtPosition(tree: Parser.Tree, line: number, col: number): Parser.SyntaxNode {
    return tree.rootNode.descendantForPosition({ row: line, column: col });
}

export interface NumberValue {
    value: number;
    decimal: string;
    hex: string;
    binary: string;
    octal: string;
    isFixedPoint?: boolean;
}

export function parseNumberLiteral(text: string): NumberValue | null {
    let value: number;

    // Fixed-point: e.g. 1.5q8
    const fixedMatch = text.match(/^(\d+)\.(\d+)[qQ](\d+)$/);
    if (fixedMatch) {
        const int = parseInt(fixedMatch[1], 10);
        const frac = parseInt(fixedMatch[2], 10);
        const bits = parseInt(fixedMatch[3], 10);
        value = int + frac / (1 << bits);
        return {
            value,
            decimal: `${value}`,
            hex: `(fixed-point)`,
            binary: `(fixed-point)`,
            octal: `(fixed-point)`,
            isFixedPoint: true,
        };
    }

    const cleaned = text.replace(/_/g, '');

    if (cleaned.startsWith('$') || cleaned.toLowerCase().startsWith('0x')) {
        const hex = cleaned.startsWith('$') ? cleaned.substring(1) : cleaned.substring(2);
        value = parseInt(hex, 16);
    } else if (cleaned.startsWith('%') || cleaned.toLowerCase().startsWith('0b')) {
        const bin = cleaned.startsWith('%') ? cleaned.substring(1) : cleaned.substring(2);
        value = parseInt(bin, 2);
    } else if (cleaned.startsWith('&') || cleaned.toLowerCase().startsWith('0o')) {
        const oct = cleaned.startsWith('&') ? cleaned.substring(1) : cleaned.substring(2);
        value = parseInt(oct, 8);
    } else {
        value = parseInt(cleaned, 10);
    }

    if (isNaN(value)) return null;

    return {
        value,
        decimal: value.toString(10),
        hex: '$' + value.toString(16).toUpperCase(),
        binary: '%' + value.toString(2),
        octal: '&' + value.toString(8),
    };
}

/** Strip surrounding quotes from an RGBDS string literal: "...", """...""", or #"..." */
export function stripQuotes(text: string): string {
    if (text.startsWith('#"')) text = text.slice(1); // remove # prefix
    if (text.startsWith('"""') && text.endsWith('"""')) return text.slice(3, -3);
    if (text.length >= 2) return text.slice(1, -1);
    return text;
}

/** Parse a simple RGBDS number literal ($hex, %bin, 0xhex, decimal). */
export function tryParseNumber(text: string): number | null {
    const trimmed = text.trim();
    if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    if (/^\$[0-9a-fA-F]+$/.test(trimmed)) return parseInt(trimmed.slice(1), 16);
    if (/^0x[0-9a-fA-F]+$/i.test(trimmed)) return parseInt(trimmed, 16);
    if (/^%[01]+$/.test(trimmed)) return parseInt(trimmed.slice(1), 2);
    return null;
}

/** Evaluate a simple RGBDS expression with arithmetic, bitwise, and comparison operators + _NARG. */
export function evalExpr(
    expr: string,
    args: string[],
    resolveValue: (text: string) => number | null,
): number | null {
    const s = expr.trim();
    if (s === '_NARG') return args.length;

    // Tokenize: split on multi-char operators first (>=, <=, ==, !=), then single-char
    const tokens = s.match(/(?:>=|<=|==|!=|[^+\-&|^><=!]+|[+\-&|^><])/g);
    if (!tokens) return resolveValue(s);

    const values: number[] = [];
    const ops: string[] = [];
    let expectValue = true;

    for (const raw of tokens) {
        const tok = raw.trim();
        if (!tok) continue;
        if (expectValue) {
            if (tok === '_NARG') {
                values.push(args.length);
            } else {
                const v = resolveValue(tok);
                if (v === null) return null;
                values.push(v);
            }
            expectValue = false;
        } else {
            ops.push(tok);
            expectValue = true;
        }
    }

    if (values.length === 0) return null;
    if (values.length === 1) return values[0];

    let result = values[0];
    for (let i = 0; i < ops.length; i++) {
        const v = values[i + 1];
        switch (ops[i]) {
            case '+': result = result + v; break;
            case '-': result = result - v; break;
            case '&': result = result & v; break;
            case '|': result = result | v; break;
            case '^': result = result ^ v; break;
            case '>': result = (result > v) ? 1 : 0; break;
            case '<': result = (result < v) ? 1 : 0; break;
            case '>=': result = (result >= v) ? 1 : 0; break;
            case '<=': result = (result <= v) ? 1 : 0; break;
            case '==': result = (result === v) ? 1 : 0; break;
            case '!=': result = (result !== v) ? 1 : 0; break;
            default: return null;
        }
    }
    return result;
}

export function collectRgbdsFiles(rootDir: string): string[] {
    const result: string[] = [];
    const stack = [rootDir];

    while (stack.length > 0) {
        const dir = stack.pop()!;
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            continue;
        }
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (ext === '.asm' || ext === '.inc') {
                    result.push(fullPath);
                }
            }
        }
    }

    return result;
}

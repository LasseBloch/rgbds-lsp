
import { describe, it, expect } from 'vitest';
import { stripQuotes, parseNumberLiteral, tryParseNumber, evalExpr, uriToPath, collectRgbdsFiles, pathToUri } from '../src/utils';

// ---------------------------------------------------------------------------
// uriToPath / pathToUri
// ---------------------------------------------------------------------------

describe('uriToPath', () => {
    it('preserves the leading slash of a POSIX absolute path from a standard LSP URI', () => {
        // A well-formed file:// URI for /home/user/project is
        // 'file://' + '/home/user/project' -- the third slash belongs to the
        // path itself, not the scheme delimiter. This is exactly the shape of
        // rootUri/workspaceFolders[].uri/textDocument.uri as sent by a real
        // LSP client, e.g. when resolving sample.asm -> utils.asm -> hw.asm
        // includes rooted at the workspace folder.
        //
        // This is POSIX-specific: on Windows, a drive-letter URI
        // (file:///C:/Users/...) has that extra slash before the drive
        // letter -- which is *not* part of the Windows path itself
        // (C:\Users\... has no leading separator) -- so stripping 8 chars
        // happens to land exactly on the drive letter and is correct there.
        // On POSIX, the root '/' IS part of the path, so stripping 8 chars
        // eats it and leaves a relative path.
        const uri = 'file:///home/user/project/sample.asm';
        expect(uriToPath(uri)).toBe('/home/user/project/sample.asm');
    });
});

describe('pathToUri', () => {
    it('does not duplicate the leading slash when converting a POSIX absolute path', () => {
        // Mirror image of the uriToPath bug: prefixing with 'file:///' adds
        // a slash that's meant to separate the scheme from a Windows drive
        // letter (which has none of its own), but on POSIX the path already
        // supplies its own leading '/', so the result gets four slashes
        // instead of three.
        const filePath = '/home/user/project/sample.asm';
        expect(pathToUri(filePath)).toBe('file:///home/user/project/sample.asm');
    });
});

describe('uriToPath / pathToUri round trip', () => {
    it('round-trips a real absolute path through pathToUri -> uriToPath', () => {
        const filePath = '/home/user/project/utils.asm';
        expect(uriToPath(pathToUri(filePath))).toBe(filePath);
    });
});

// ---------------------------------------------------------------------------
// stripQuotes
// ---------------------------------------------------------------------------

describe('stripQuotes', () => {
    it('strips regular double-quoted string', () => {
        expect(stripQuotes('"hello"')).toBe('hello');
    });

    it('strips triple-quoted string', () => {
        expect(stripQuotes('"""hello"""')).toBe('hello');
    });

    it('strips #-prefixed string', () => {
        expect(stripQuotes('#"hello"')).toBe('hello');
    });

    it('strips empty double-quoted string', () => {
        expect(stripQuotes('""')).toBe('');
    });

    it('strips single-character double-quoted string', () => {
        expect(stripQuotes('"a"')).toBe('a');
    });
});

// ---------------------------------------------------------------------------
// parseNumberLiteral
// ---------------------------------------------------------------------------

describe('parseNumberLiteral', () => {
    it('parses hex with $ prefix', () => {
        const result = parseNumberLiteral('$FF');
        expect(result).not.toBeNull();
        expect(result!.value).toBe(255);
    });

    it('parses hex with 0x prefix', () => {
        const result = parseNumberLiteral('0xFF');
        expect(result).not.toBeNull();
        expect(result!.value).toBe(255);
    });

    it('parses binary with % prefix', () => {
        const result = parseNumberLiteral('%1010');
        expect(result).not.toBeNull();
        expect(result!.value).toBe(10);
    });

    it('parses decimal', () => {
        const result = parseNumberLiteral('42');
        expect(result).not.toBeNull();
        expect(result!.value).toBe(42);
    });

    it('returns null for non-numeric', () => {
        expect(parseNumberLiteral('hello')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// tryParseNumber
// ---------------------------------------------------------------------------

describe('tryParseNumber', () => {
    it('parses decimal', () => expect(tryParseNumber('42')).toBe(42));
    it('parses hex with $', () => expect(tryParseNumber('$FF')).toBe(255));
    it('parses hex with 0x', () => expect(tryParseNumber('0xBA')).toBe(186));
    it('parses binary with %', () => expect(tryParseNumber('%1010')).toBe(10));
    it('returns null for identifiers', () => expect(tryParseNumber('foo')).toBeNull());
    it('returns null for empty', () => expect(tryParseNumber('')).toBeNull());
});

// ---------------------------------------------------------------------------
// evalExpr
// ---------------------------------------------------------------------------

describe('evalExpr', () => {
    const resolve = (text: string) => tryParseNumber(text);

    describe('arithmetic', () => {
        it('evaluates addition', () => {
            expect(evalExpr('1 + 2', [], resolve)).toBe(3);
        });
        it('evaluates subtraction', () => {
            expect(evalExpr('$10 - $01', [], resolve)).toBe(15);
        });
        it('evaluates single value', () => {
            expect(evalExpr('$FF', [], resolve)).toBe(255);
        });
    });

    describe('bitwise', () => {
        it('evaluates AND', () => {
            expect(evalExpr('$FF & $0F', [], resolve)).toBe(0x0F);
        });
        it('evaluates OR', () => {
            expect(evalExpr('$F0 | $0F', [], resolve)).toBe(0xFF);
        });
        it('evaluates XOR', () => {
            expect(evalExpr('$FF ^ $0F', [], resolve)).toBe(0xF0);
        });
    });

    describe('comparison', () => {
        it('evaluates > true', () => {
            expect(evalExpr('3 > 0', [], resolve)).toBe(1);
        });
        it('evaluates > false', () => {
            expect(evalExpr('0 > 3', [], resolve)).toBe(0);
        });
        it('evaluates < true', () => {
            expect(evalExpr('1 < 5', [], resolve)).toBe(1);
        });
        it('evaluates >= equal', () => {
            expect(evalExpr('3 >= 3', [], resolve)).toBe(1);
        });
        it('evaluates <= less', () => {
            expect(evalExpr('2 <= 5', [], resolve)).toBe(1);
        });
        it('evaluates == true', () => {
            expect(evalExpr('$FF == 255', [], resolve)).toBe(1);
        });
        it('evaluates == false', () => {
            expect(evalExpr('1 == 2', [], resolve)).toBe(0);
        });
        it('evaluates != true', () => {
            expect(evalExpr('1 != 2', [], resolve)).toBe(1);
        });
    });

    describe('_NARG', () => {
        it('returns arg count', () => {
            expect(evalExpr('_NARG', ['a', 'b', 'c'], resolve)).toBe(3);
        });
        it('compares _NARG > 0 with args', () => {
            expect(evalExpr('_NARG > 0', ['$ba', '$71', '$07'], resolve)).toBe(1);
        });
        it('compares _NARG > 0 without args', () => {
            expect(evalExpr('_NARG > 0', [], resolve)).toBe(0);
        });
    });

    describe('edge cases', () => {
        it('returns null for unresolvable identifier', () => {
            expect(evalExpr('UNKNOWN_VAR', [], resolve)).toBeNull();
        });
        it('handles custom resolver', () => {
            const customResolve = (text: string) => {
                if (text === 'MY_CONST') return 42;
                return tryParseNumber(text);
            };
            expect(evalExpr('MY_CONST + 8', [], customResolve)).toBe(50);
        });
    });
});

// ---------------------------------------------------------------------------
// collectRgbdsFiles
// ---------------------------------------------------------------------------

describe('collectRgbdsFiles', () => {
    let tmpDir: string;

    afterEach(() => {
        if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('finds .asm, .inc, .rgbasm, and .rgbinc files, ignoring others', () => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rgbds-lsp-test-'));
        const names = ['main.asm', 'utils.inc', 'main.rgbasm', 'utils.rgbinc', 'readme.txt'];
        for (const name of names) fs.writeFileSync(path.join(tmpDir, name), '');

        const found = collectRgbdsFiles(tmpDir).map((f) => path.basename(f)).sort();
        expect(found).toEqual(['main.asm', 'main.rgbasm', 'utils.inc', 'utils.rgbinc'].sort());
    });

    it('is case-insensitive on extension', () => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rgbds-lsp-test-'));
        fs.writeFileSync(path.join(tmpDir, 'main.RGBASM'), '');
        fs.writeFileSync(path.join(tmpDir, 'utils.RgbInc'), '');

        const found = collectRgbdsFiles(tmpDir).map((f) => path.basename(f)).sort();
        expect(found).toEqual(['main.RGBASM', 'utils.RgbInc'].sort());
    });

    it('recurses into subdirectories', () => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rgbds-lsp-test-'));
        fs.mkdirSync(path.join(tmpDir, 'sub'));
        fs.writeFileSync(path.join(tmpDir, 'sub', 'nested.rgbasm'), '');

        const found = collectRgbdsFiles(tmpDir).map((f) => path.basename(f));
        expect(found).toContain('nested.rgbasm');
    });
});

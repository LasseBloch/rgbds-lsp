import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LspTestClient } from './lsp-client';
import { SM83_INSTRUCTIONS } from '../src/instructions';
import * as path from 'path';
import * as fs from 'fs';

const FIXTURES = path.resolve(__dirname, 'fixtures');
const ROOT_URI = 'file:///' + FIXTURES.replace(/\\/g, '/');

function fileUri(name: string): string {
    return ROOT_URI + '/' + name;
}

describe('LSP integration', () => {
    let client: LspTestClient;

    beforeAll(async () => {
        client = new LspTestClient();
        await client.initialize(ROOT_URI);

        // Open fixture files so the server tracks them
        const mainContent = fs.readFileSync(path.join(FIXTURES, 'main.asm'), 'utf-8');
        client.openDocument(fileUri('main.asm'), mainContent);

        const utilsContent = fs.readFileSync(path.join(FIXTURES, 'utils.inc'), 'utf-8');
        client.openDocument(fileUri('utils.inc'), utilsContent);

        // Wait for background indexing to pick up fixture files
        // main.asm has: Main, InitSystem, PLAYER_MAX_HP, section "Main"
        // utils.inc has: SCREEN_WIDTH, SCREEN_HEIGHT, CopyBytes
        await client.waitForIndexing(5, 15000);
    }, 20000);

    afterAll(async () => {
        await client.shutdown();
    });

    describe('initialize', () => {
        it('should respond within timeout', async () => {
            // Already initialized in beforeAll — if we got here, it worked
            expect(true).toBe(true);
        });
    });

    describe('hover', () => {
        it('should return hover info for a label', async () => {
            // "Main" is on line 2 (0-indexed), col 0
            const result = await client.hover(fileUri('main.asm'), 2, 0) as any;
            expect(result).not.toBeNull();
            expect(result.contents.value).toContain('Main');
            expect(result.contents.value).toContain('label');
        });

        it('should return hover info for a constant', async () => {
            // PLAYER_MAX_HP is on line 15, col 0
            const result = await client.hover(fileUri('main.asm'), 15, 0) as any;
            expect(result).not.toBeNull();
            expect(result.contents.value).toContain('PLAYER_MAX_HP');
            expect(result.contents.value).toContain('constant');
        });

        it('should return null for empty space', async () => {
            const result = await client.hover(fileUri('main.asm'), 0, 50);
            expect(result).toBeNull();
        });
    });

    describe('go to definition', () => {
        it('should find definition of a called label', async () => {
            // "InitSystem" reference on line 3: "call InitSystem"
            const result = await client.definition(fileUri('main.asm'), 3, 10) as any;
            expect(result).not.toBeNull();
            expect(result.uri).toContain('main.asm');
            // InitSystem is defined on line 6
            expect(result.range.start.line).toBe(6);
        });

        it('should find definition of Main label', async () => {
            // "Main" reference on line 4: "jr Main"
            const result = await client.definition(fileUri('main.asm'), 4, 7) as any;
            expect(result).not.toBeNull();
            expect(result.range.start.line).toBe(2);
        });
    });

    describe('find references', () => {
        it('should find all references to a label', async () => {
            // "Main" defined line 2, referenced line 4
            const result = await client.references(fileUri('main.asm'), 2, 0) as any[];
            expect(result.length).toBeGreaterThanOrEqual(2); // def + ref
        });

        it('should find references to InitSystem', async () => {
            const result = await client.references(fileUri('main.asm'), 6, 0) as any[];
            expect(result.length).toBeGreaterThanOrEqual(2); // def + call
        });
    });

    describe('completion', () => {
        it('should return all project symbols', async () => {
            const result = await client.completion(fileUri('main.asm'), 3, 10) as any[];
            expect(result.length).toBeGreaterThan(0);
            const names = result.map((r: any) => r.label);
            expect(names).toContain('Main');
            expect(names).toContain('InitSystem');
            expect(names).toContain('PLAYER_MAX_HP');
        });

        it('should include symbols from other files', async () => {
            const result = await client.completion(fileUri('main.asm'), 3, 10) as any[];
            const names = result.map((r: any) => r.label);
            expect(names).toContain('CopyBytes');
            expect(names).toContain('SCREEN_WIDTH');
        });
    });

    describe('document symbols', () => {
        it('should return symbols for main.asm', async () => {
            const result = await client.documentSymbol(fileUri('main.asm')) as any[];
            expect(result.length).toBeGreaterThan(0);
            const names = result.map((s: any) => s.name);
            expect(names).toContain('Main');
            expect(names).toContain('InitSystem');
            expect(names).toContain('PLAYER_MAX_HP');
        });

        it('should nest local labels under globals', async () => {
            const result = await client.documentSymbol(fileUri('main.asm')) as any[];
            const initSystem = result.find((s: any) => s.name === 'InitSystem');
            expect(initSystem).toBeDefined();
            expect(initSystem.children.length).toBeGreaterThan(0);
            expect(initSystem.children[0].name).toContain('waitVBlank');
        });
    });

    describe('rename', () => {
        it('should rename a label across references', async () => {
            // Rename "Main" (line 2, col 0)
            const result = await client.rename(fileUri('main.asm'), 2, 0, 'EntryPoint') as any;
            expect(result).not.toBeNull();
            expect(result.changes).toBeDefined();
            // Should have edits in main.asm (definition + jr reference)
            const mainEdits = result.changes[fileUri('main.asm')];
            expect(mainEdits.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('inlay hints', () => {
        it('should show constant value hints', async () => {
            const testUri = fileUri('inlay_test.asm');
            client.openDocument(testUri, [
                'SECTION "Test", ROM0',
                '    ld a, PLAYER_MAX_HP',
            ].join('\n'));
            await new Promise(r => setTimeout(r, 300));

            const hints = await client.inlayHint(testUri, 0, 2) as any[];
            // PLAYER_MAX_HP EQU $64 should show a constant value hint
            expect(hints).not.toBeNull();
            expect(Array.isArray(hints)).toBe(true);
            expect(hints.length).toBeGreaterThan(0);
            const valueHint = hints.find((h: any) => {
                const label = typeof h.label === 'string' ? h.label : '';
                return label.includes('$64') || label.includes('= $');
            });
            expect(valueHint).toBeDefined();
        });
    });

    describe('semantic tokens', () => {
        it('should return full semantic tokens', async () => {
            const result = await client.semanticTokensFull(fileUri('main.asm')) as any;
            expect(result).not.toBeNull();
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeGreaterThan(0);
        });

        it('should return range semantic tokens', async () => {
            const result = await client.semanticTokensRange(fileUri('main.asm'), 0, 5) as any;
            expect(result).not.toBeNull();
            expect(result.data).toBeDefined();
        });
    });

    describe('folding ranges', () => {
        it('should return folding ranges for sections', async () => {
            const result = await client.foldingRange(fileUri('main.asm')) as any[];
            expect(result).not.toBeNull();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('rename errors', () => {
        it('should reject invalid identifier names', async () => {
            try {
                await client.rename(fileUri('main.asm'), 2, 0, '123invalid');
                expect.fail('Should have thrown');
            } catch (e: any) {
                expect(e.message).toContain('Invalid');
            }
        });
    });

    describe('signature help', () => {
        it('should provide signature for macro invocations', async () => {
            const testUri = fileUri('sig_test.asm');
            client.openDocument(testUri, [
                'SECTION "SigTest", ROM0',
                '    MyTestMacro $FF, $C000',
            ].join('\n'));
            await new Promise(r => setTimeout(r, 300));

            // Position inside the macro arguments (after "MyTestMacro ")
            const result = await client.signatureHelp(testUri, 1, 20) as any;
            expect(result).not.toBeNull();
            expect(result.signatures.length).toBeGreaterThan(0);
            expect(result.signatures[0].label).toContain('MyTestMacro');
        });
    });

    describe('alternate addressing-mode spellings', () => {
        const lines = [
            '    ld [hli], a',
            '    ld [hld], a',
            '    ld a, [hli]',
            '    ld a, [hld]',
            '    ld [$ff00+c], a',
            '    ld a, [$ff00+c]',
            '    ld [$FF00+C], a',
            '    ld a, [$FF00 + C]',
            '    ld [hl+], a',
            '    ldi [hl], a',
            '    ldd a, [hl]',
        ];
        const testUri = fileUri('addr_modes.asm');

        beforeAll(async () => {
            client.openDocument(testUri, ['SECTION "AddrModes", ROM0', ...lines].join('\n'));
            await new Promise(r => setTimeout(r, 300));
        });

        it('should not report undefined symbols for register aliases', async () => {
            const diags = await client.diagnostics(testUri) as any[];
            const undefinedDiags = diags.filter(d => d.message.includes('Undefined symbol'));
            expect(undefinedDiags).toEqual([]);
        });

        it('should still report genuinely undefined symbols in similar expressions', async () => {
            const badUri = fileUri('addr_modes_bad.asm');
            client.openDocument(badUri, [
                'SECTION "AddrModesBad", ROM0',
                '    ld a, [NotDefinedAnywhere+c]',
            ].join('\n'));

            const diags = await client.diagnostics(badUri) as any[];
            const undefinedDiags = diags.filter(d => d.message.includes('Undefined symbol'));
            expect(undefinedDiags.some(d => d.message.includes('NotDefinedAnywhere'))).toBe(true);
        });

        it('should hover the specific form for "ld [$ff00+c], a"', async () => {
            // "ld" mnemonic on the "ld [$ff00+c], a" line (line 5, col 4)
            const result = await client.hover(testUri, 5, 4) as any;
            expect(result).not.toBeNull();
            expect(result.contents.value).toContain('ld [$ff00+c], a');
            expect(result.contents.value).toContain('$FF00+C');
            expect(result.contents.value).toContain('1 byte · 8 cycles');
        });

        it('should hover the specific form for "ld a, [$ff00+c]"', async () => {
            // "ld" mnemonic on the "ld a, [$ff00+c]" line (line 6, col 4)
            const result = await client.hover(testUri, 6, 4) as any;
            expect(result).not.toBeNull();
            expect(result.contents.value).toContain('ld a, [$ff00+c]');
            expect(result.contents.value).toContain('$FF00+C');
            expect(result.contents.value).toContain('1 byte · 8 cycles');
        });

        it('should not offer the removed "ld [c], a" syntax in the instruction table', () => {
            // LD [C],A / LD A,[C] were deprecated in RGBDS 0.9.0 and removed in 1.0.0
            const bad = SM83_INSTRUCTIONS.filter(
                i => i.mnemonic === 'ld' && /\[\s*c\s*\]/.test(i.label)
            );
            expect(bad).toEqual([]);
        });

        it('should hover the canonical ld [hli], a form for "ld [hli], a"', async () => {
            // "ld" mnemonic on the "ld [hli], a" line (line 1, col 4)
            const result = await client.hover(testUri, 1, 4) as any;
            expect(result).not.toBeNull();
            expect(result.contents.value).toContain('ld [hli], a');
        });

        it('should hover the canonical ld [hli], a form for the "ld [hl+], a" alternate', async () => {
            // "ld" mnemonic on the "ld [hl+], a" line (line 9, col 4)
            const result = await client.hover(testUri, 9, 4) as any;
            expect(result).not.toBeNull();
            expect(result.contents.value).toContain('ld [hli], a');
        });

        it('should hover the ldi [hl], a form', async () => {
            // "ldi" mnemonic on line 10, col 4
            const result = await client.hover(testUri, 10, 4) as any;
            expect(result).not.toBeNull();
            expect(result.contents.value).toContain('ldi [hl], a');
            expect(result.contents.value).toContain('1 byte · 8 cycles');
        });

        it('should hover the ldd a, [hl] form', async () => {
            // "ldd" mnemonic on line 11, col 4
            const result = await client.hover(testUri, 11, 4) as any;
            expect(result).not.toBeNull();
            expect(result.contents.value).toContain('ldd a, [hl]');
            expect(result.contents.value).toContain('1 byte · 8 cycles');
        });

        it('should use the canonical [hli]/[hld] spelling in the instruction table', () => {
            // RGBDS documents LD [HLI],A as canonical; [HL+]/[HL-] are the alternates
            const alternates = SM83_INSTRUCTIONS.filter(i => /\[hl[+-]\]/.test(i.label));
            expect(alternates).toEqual([]);
        });
    });

    describe('incremental reindex', () => {
        it('should update symbols when a file changes', async () => {
            // Verify InitSystem exists before the change
            const hoverBefore = await client.hover(fileUri('main.asm'), 3, 10) as any;
            expect(hoverBefore).not.toBeNull();
            expect(hoverBefore.contents.value).toContain('InitSystem');

            // "Edit" the file: rename InitSystem to BootSystem
            const newContent = fs.readFileSync(path.join(FIXTURES, 'main.asm'), 'utf-8')
                .replace(/InitSystem/g, 'BootSystem');
            client.openDocument(fileUri('main.asm'), newContent);

            // Small delay for server to process the didChange
            await new Promise(r => setTimeout(r, 200));

            // Old name should no longer resolve
            // "call InitSystem" was on line 3 — now it says "call BootSystem"
            // Hover on the new name at the definition (line 6, col 0)
            const hoverNew = await client.hover(fileUri('main.asm'), 6, 0) as any;
            expect(hoverNew).not.toBeNull();
            expect(hoverNew.contents.value).toContain('BootSystem');

            // Completion should have BootSystem, not InitSystem
            const completion = await client.completion(fileUri('main.asm'), 0, 0) as any[];
            const names = completion.map((c: any) => c.label);
            expect(names).toContain('BootSystem');
            expect(names).not.toContain('InitSystem');

            // Symbols from other files should still be intact
            expect(names).toContain('CopyBytes');
            expect(names).toContain('SCREEN_WIDTH');

            // Restore original content
            const original = fs.readFileSync(path.join(FIXTURES, 'main.asm'), 'utf-8');
            client.openDocument(fileUri('main.asm'), original);
        }, 15000);

        it('should not lose cross-file symbols on single file reindex', async () => {
            // Count total symbols before
            const before = await client.completion(fileUri('main.asm'), 0, 0) as any[];
            const countBefore = before.length;

            // Re-open utils.inc with identical content (triggers reindex)
            const utilsContent = fs.readFileSync(path.join(FIXTURES, 'utils.inc'), 'utf-8');
            client.openDocument(fileUri('utils.inc'), utilsContent);
            await new Promise(r => setTimeout(r, 200));

            // Count should be the same — no symbols lost
            const after = await client.completion(fileUri('main.asm'), 0, 0) as any[];
            expect(after.length).toBe(countBefore);
        }, 15000);
    });
});

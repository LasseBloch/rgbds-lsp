import { describe, it, expect, beforeEach } from 'vitest';
import { Indexer } from '../src/indexer';

// ---------------------------------------------------------------------------
// Per-file index
// ---------------------------------------------------------------------------

describe('Indexer per-file index', () => {
    let indexer: Indexer;

    beforeEach(() => {
        indexer = new Indexer();
    });

    it('populates fileDefinitions after indexing a file', () => {
        const uri = 'file:///test/example.asm';
        const content = [
            'SECTION "Main", ROM0',
            'MyLabel:',
            '    ld a, 0',
            'MY_CONST EQU 42',
        ].join('\n');

        indexer.indexFile(uri, content);

        const defs = indexer.fileDefinitions.get(uri);
        expect(defs).toBeDefined();
        expect(defs!.has('MyLabel')).toBe(true);
        expect(defs!.has('MY_CONST')).toBe(true);
    });

    it('populates fileReferences after indexing a file', () => {
        const uri = 'file:///test/example.asm';
        const content = [
            'SECTION "Main", ROM0',
            'MyLabel:',
            '    call OtherLabel',
            'OtherLabel:',
            '    ret',
        ].join('\n');

        indexer.indexFile(uri, content);

        const refs = indexer.fileReferences.get(uri);
        expect(refs).toBeDefined();
        expect(refs!.has('OtherLabel')).toBe(true);
    });

    it('clears old entries and populates new ones on re-index', () => {
        const uri = 'file:///test/example.asm';

        indexer.indexFile(uri, [
            'SECTION "Main", ROM0',
            'OldLabel:',
            '    ld a, 0',
            'OLD_CONST EQU 10',
        ].join('\n'));

        expect(indexer.fileDefinitions.get(uri)!.has('OldLabel')).toBe(true);
        expect(indexer.fileDefinitions.get(uri)!.has('OLD_CONST')).toBe(true);

        indexer.indexFile(uri, [
            'SECTION "Main", ROM0',
            'NewLabel:',
            '    ld a, 0',
            'NEW_CONST EQU 99',
        ].join('\n'));

        const defsAfter = indexer.fileDefinitions.get(uri);
        expect(defsAfter).toBeDefined();
        expect(indexer.definitions.has('OldLabel')).toBe(false);
        expect(indexer.definitions.has('OLD_CONST')).toBe(false);
        expect(defsAfter!.has('NewLabel')).toBe(true);
        expect(defsAfter!.has('NEW_CONST')).toBe(true);
    });

    it('does not lose symbols from other files when re-indexing one file', () => {
        indexer.indexFile('file:///test/a.asm', 'SECTION "A", ROM0\nLabelA:\n    ret');
        indexer.indexFile('file:///test/b.asm', 'SECTION "B", ROM0\nLabelB:\n    ret');

        expect(indexer.definitions.has('LabelA')).toBe(true);
        expect(indexer.definitions.has('LabelB')).toBe(true);

        indexer.indexFile('file:///test/a.asm', 'SECTION "A", ROM0\nLabelA:\n    nop');

        expect(indexer.definitions.has('LabelA')).toBe(true);
        expect(indexer.definitions.has('LabelB')).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// allDefinitions (duplicate tracking)
// ---------------------------------------------------------------------------

describe('Indexer allDefinitions', () => {
    it('tracks all definitions including duplicates', () => {
        const indexer = new Indexer();
        indexer.indexFile('file:///a.asm', 'MyLabel:\n    ret');
        indexer.indexFile('file:///b.asm', 'MyLabel:\n    ret');

        const allDefs = indexer.allDefinitions.get('MyLabel');
        expect(allDefs).toBeDefined();
        expect(allDefs!.length).toBe(2);
        expect(allDefs!.map(d => d.file)).toContain('file:///a.asm');
        expect(allDefs!.map(d => d.file)).toContain('file:///b.asm');
    });

    it('cleans up allDefinitions on reindex', () => {
        const indexer = new Indexer();
        indexer.indexFile('file:///a.asm', 'OldLabel:\n    ret');
        indexer.indexFile('file:///a.asm', 'NewLabel:\n    ret');

        expect(indexer.allDefinitions.has('OldLabel')).toBe(false);
        expect(indexer.allDefinitions.has('NewLabel')).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// removeFolder
// ---------------------------------------------------------------------------

describe('Indexer removeFolder', () => {
    it('removes all symbols from a folder', () => {
        const indexer = new Indexer();
        indexer.indexFile('file:///project/src/a.asm', 'LabelA:\n    ret');
        indexer.indexFile('file:///project/src/b.asm', 'LabelB:\n    ret');
        indexer.indexFile('file:///other/c.asm', 'LabelC:\n    ret');

        indexer.removeFolder('/project/src');

        expect(indexer.definitions.has('LabelA')).toBe(false);
        expect(indexer.definitions.has('LabelB')).toBe(false);
        expect(indexer.definitions.has('LabelC')).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Charmap type
// ---------------------------------------------------------------------------

describe('Indexer charmap type', () => {
    it('stores NEWCHARMAP as charmap type', () => {
        const indexer = new Indexer();
        indexer.indexFile('file:///test.asm', 'NEWCHARMAP mymap');

        const def = indexer.definitions.get('mymap');
        expect(def).toBeDefined();
        expect(def!.type).toBe('charmap');
    });
});

// ---------------------------------------------------------------------------
// Local label scoping
// ---------------------------------------------------------------------------

describe('Indexer local label scoping', () => {
    it('scopes local labels to their parent global label', () => {
        const indexer = new Indexer();
        indexer.indexFile('file:///test.asm', [
            'GlobalA:',
            '.local:',
            '    ret',
            'GlobalB:',
            '.local:',
            '    ret',
        ].join('\n'));

        expect(indexer.definitions.has('GlobalA.local')).toBe(true);
        expect(indexer.definitions.has('GlobalB.local')).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Alternate addressing-mode spellings
// ---------------------------------------------------------------------------

describe('Indexer alternate addressing-mode spellings', () => {
    const aliasLines = [
        'ld [hli], a',
        'ld [hld], a',
        'ld a, [hli]',
        'ld a, [hld]',
        'ld [$ff00+c], a',
        'ld a, [$ff00+c]',
        'ld [$FF00+C], a',
        'ld a, [$FF00 + C]',
    ];

    for (const line of aliasLines) {
        it(`does not index a symbol reference for "${line}"`, () => {
            const indexer = new Indexer();
            indexer.indexFile('file:///test.asm', line + '\n');

            expect(indexer.references.get('hli')).toBeUndefined();
            expect(indexer.references.get('hld')).toBeUndefined();
            expect(indexer.references.get('c')).toBeUndefined();
            expect(indexer.references.get('C')).toBeUndefined();
        });
    }

    it('still indexes genuine symbols in similar-looking expressions', () => {
        const indexer = new Indexer();
        indexer.indexFile('file:///test.asm', 'ld a, [foo+c]\n');

        expect(indexer.references.get('foo')).toBeDefined();
    });

    it('still indexes genuine symbols in other memory operands', () => {
        const indexer = new Indexer();
        indexer.indexFile('file:///test.asm', 'ld a, [hliCounter]\n');

        expect(indexer.references.get('hliCounter')).toBeDefined();
    });
});

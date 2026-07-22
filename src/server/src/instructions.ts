export interface InstructionForm {
    label: string;
    insertText: string;
    mnemonic: string;
    bytes: number;
    cycles: string;
    flags: string;
    description: string;
    opcode?: number[];
}

export const SM83_INSTRUCTIONS: InstructionForm[] = [
    // ========================================================================
    // ADC
    // ========================================================================
    {
        label: "adc a, r8",
        insertText: "adc a, ${1|a,b,c,d,e,h,l|}",
        mnemonic: "adc",
        bytes: 1,
        cycles: "4",
        flags: "Z:? N:0 H:? C:?",
        description: "Add the value in r8 plus the carry flag to A.",
    },
    {
        label: "adc a, [hl]",
        insertText: "adc a, [hl]",
        mnemonic: "adc",
        bytes: 1,
        cycles: "8",
        flags: "Z:? N:0 H:? C:?",
        description: "Add the byte pointed to by HL plus the carry flag to A.",
        opcode: [0x8E],
    },
    {
        label: "adc a, n8",
        insertText: "adc a, ${1:n8}",
        mnemonic: "adc",
        bytes: 2,
        cycles: "8",
        flags: "Z:? N:0 H:? C:?",
        description: "Add the value n8 plus the carry flag to A.",
        opcode: [0xCE],
    },

    // ========================================================================
    // ADD
    // ========================================================================
    {
        label: "add a, r8",
        insertText: "add a, ${1|a,b,c,d,e,h,l|}",
        mnemonic: "add",
        bytes: 1,
        cycles: "4",
        flags: "Z:? N:0 H:? C:?",
        description: "Add the value in r8 to A.",
    },
    {
        label: "add a, [hl]",
        insertText: "add a, [hl]",
        mnemonic: "add",
        bytes: 1,
        cycles: "8",
        flags: "Z:? N:0 H:? C:?",
        description: "Add the byte pointed to by HL to A.",
        opcode: [0x86],
    },
    {
        label: "add a, n8",
        insertText: "add a, ${1:n8}",
        mnemonic: "add",
        bytes: 2,
        cycles: "8",
        flags: "Z:? N:0 H:? C:?",
        description: "Add the value n8 to A.",
        opcode: [0xC6],
    },
    {
        label: "add hl, r16",
        insertText: "add hl, ${1|bc,de,hl|}",
        mnemonic: "add",
        bytes: 1,
        cycles: "8",
        flags: "Z:- N:0 H:? C:?",
        description: "Add the value in r16 to HL.",
    },
    {
        label: "add hl, sp",
        insertText: "add hl, sp",
        mnemonic: "add",
        bytes: 1,
        cycles: "8",
        flags: "Z:- N:0 H:? C:?",
        description: "Add the value in SP to HL.",
        opcode: [0x39],
    },
    {
        label: "add sp, e8",
        insertText: "add sp, ${1:e8}",
        mnemonic: "add",
        bytes: 2,
        cycles: "16",
        flags: "Z:0 N:0 H:? C:?",
        description: "Add the signed value e8 to SP.",
        opcode: [0xE8],
    },

    // ========================================================================
    // AND
    // ========================================================================
    {
        label: "and a, r8",
        insertText: "and a, ${1|a,b,c,d,e,h,l|}",
        mnemonic: "and",
        bytes: 1,
        cycles: "4",
        flags: "Z:? N:0 H:1 C:0",
        description: "Bitwise AND between the value in r8 and A.",
    },
    {
        label: "and a, [hl]",
        insertText: "and a, [hl]",
        mnemonic: "and",
        bytes: 1,
        cycles: "8",
        flags: "Z:? N:0 H:1 C:0",
        description: "Bitwise AND between the byte pointed to by HL and A.",
        opcode: [0xA6],
    },
    {
        label: "and a, n8",
        insertText: "and a, ${1:n8}",
        mnemonic: "and",
        bytes: 2,
        cycles: "8",
        flags: "Z:? N:0 H:1 C:0",
        description: "Bitwise AND between the value n8 and A.",
        opcode: [0xE6],
    },

    // ========================================================================
    // BIT
    // ========================================================================
    {
        label: "bit u3, r8",
        insertText: "bit ${1|0,1,2,3,4,5,6,7|}, ${2|a,b,c,d,e,h,l|}",
        mnemonic: "bit",
        bytes: 2,
        cycles: "8",
        flags: "Z:? N:0 H:1 C:-",
        description: "Test bit u3 in register r8, set the zero flag if bit not set.",
    },
    {
        label: "bit u3, [hl]",
        insertText: "bit ${1|0,1,2,3,4,5,6,7|}, [hl]",
        mnemonic: "bit",
        bytes: 2,
        cycles: "12",
        flags: "Z:? N:0 H:1 C:-",
        description: "Test bit u3 in the byte pointed to by HL, set the zero flag if bit not set.",
    },

    // ========================================================================
    // CALL
    // ========================================================================
    {
        label: "call n16",
        insertText: "call ${1:n16}",
        mnemonic: "call",
        bytes: 3,
        cycles: "24",
        flags: "-",
        description: "Call address n16. Push address of next instruction on the stack, then jump to n16.",
        opcode: [0xCD],
    },
    {
        label: "call cc, n16",
        insertText: "call ${1|z,nz,c,nc|}, ${2:n16}",
        mnemonic: "call",
        bytes: 3,
        cycles: "24/12",
        flags: "-",
        description: "Call address n16 if condition cc is met.",
    },

    // ========================================================================
    // CCF
    // ========================================================================
    {
        label: "ccf",
        insertText: "ccf",
        mnemonic: "ccf",
        bytes: 1,
        cycles: "4",
        flags: "Z:- N:0 H:0 C:~C",
        description: "Complement Carry Flag.",
        opcode: [0x3F],
    },

    // ========================================================================
    // CP
    // ========================================================================
    {
        label: "cp a, r8",
        insertText: "cp a, ${1|a,b,c,d,e,h,l|}",
        mnemonic: "cp",
        bytes: 1,
        cycles: "4",
        flags: "Z:? N:1 H:? C:?",
        description: "Subtract the value in r8 from A and set flags accordingly, but discard the result.",
    },
    {
        label: "cp a, [hl]",
        insertText: "cp a, [hl]",
        mnemonic: "cp",
        bytes: 1,
        cycles: "8",
        flags: "Z:? N:1 H:? C:?",
        description: "Subtract the byte pointed to by HL from A and set flags accordingly, but discard the result.",
        opcode: [0xBE],
    },
    {
        label: "cp a, n8",
        insertText: "cp a, ${1:n8}",
        mnemonic: "cp",
        bytes: 2,
        cycles: "8",
        flags: "Z:? N:1 H:? C:?",
        description: "Subtract the value n8 from A and set flags accordingly, but discard the result.",
        opcode: [0xFE],
    },

    // ========================================================================
    // CPL
    // ========================================================================
    {
        label: "cpl",
        insertText: "cpl",
        mnemonic: "cpl",
        bytes: 1,
        cycles: "4",
        flags: "Z:- N:1 H:1 C:-",
        description: "Complement accumulator (A = ~A).",
        opcode: [0x2F],
    },

    // ========================================================================
    // DAA
    // ========================================================================
    {
        label: "daa",
        insertText: "daa",
        mnemonic: "daa",
        bytes: 1,
        cycles: "4",
        flags: "Z:? N:- H:0 C:?",
        description: "Decimal Adjust Accumulator to get a correct BCD representation after an arithmetic instruction.",
        opcode: [0x27],
    },

    // ========================================================================
    // DEC
    // ========================================================================
    {
        label: "dec r8",
        insertText: "dec ${1|a,b,c,d,e,h,l|}",
        mnemonic: "dec",
        bytes: 1,
        cycles: "4",
        flags: "Z:? N:1 H:? C:-",
        description: "Decrement value in register r8 by 1.",
    },
    {
        label: "dec [hl]",
        insertText: "dec [hl]",
        mnemonic: "dec",
        bytes: 1,
        cycles: "12",
        flags: "Z:? N:1 H:? C:-",
        description: "Decrement the byte pointed to by HL by 1.",
        opcode: [0x35],
    },
    {
        label: "dec r16",
        insertText: "dec ${1|bc,de,hl|}",
        mnemonic: "dec",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Decrement value in register r16 by 1.",
    },
    {
        label: "dec sp",
        insertText: "dec sp",
        mnemonic: "dec",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Decrement value in register SP by 1.",
        opcode: [0x3B],
    },

    // ========================================================================
    // DI
    // ========================================================================
    {
        label: "di",
        insertText: "di",
        mnemonic: "di",
        bytes: 1,
        cycles: "4",
        flags: "-",
        description: "Disable Interrupts by clearing the IME flag.",
        opcode: [0xF3],
    },

    // ========================================================================
    // EI
    // ========================================================================
    {
        label: "ei",
        insertText: "ei",
        mnemonic: "ei",
        bytes: 1,
        cycles: "4",
        flags: "-",
        description: "Enable Interrupts by setting the IME flag. The flag is only set after the instruction following EI.",
        opcode: [0xFB],
    },

    // ========================================================================
    // HALT
    // ========================================================================
    {
        label: "halt",
        insertText: "halt",
        mnemonic: "halt",
        bytes: 1,
        cycles: "4",
        flags: "-",
        description: "Enter CPU low-power consumption mode until an interrupt occurs.",
        opcode: [0x76],
    },

    // ========================================================================
    // INC
    // ========================================================================
    {
        label: "inc r8",
        insertText: "inc ${1|a,b,c,d,e,h,l|}",
        mnemonic: "inc",
        bytes: 1,
        cycles: "4",
        flags: "Z:? N:0 H:? C:-",
        description: "Increment value in register r8 by 1.",
    },
    {
        label: "inc [hl]",
        insertText: "inc [hl]",
        mnemonic: "inc",
        bytes: 1,
        cycles: "12",
        flags: "Z:? N:0 H:? C:-",
        description: "Increment the byte pointed to by HL by 1.",
        opcode: [0x34],
    },
    {
        label: "inc r16",
        insertText: "inc ${1|bc,de,hl|}",
        mnemonic: "inc",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Increment value in register r16 by 1.",
    },
    {
        label: "inc sp",
        insertText: "inc sp",
        mnemonic: "inc",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Increment value in register SP by 1.",
        opcode: [0x33],
    },

    // ========================================================================
    // JP
    // ========================================================================
    {
        label: "jp n16",
        insertText: "jp ${1:n16}",
        mnemonic: "jp",
        bytes: 3,
        cycles: "16",
        flags: "-",
        description: "Jump to address n16.",
        opcode: [0xC3],
    },
    {
        label: "jp cc, n16",
        insertText: "jp ${1|z,nz,c,nc|}, ${2:n16}",
        mnemonic: "jp",
        bytes: 3,
        cycles: "16/12",
        flags: "-",
        description: "Jump to address n16 if condition cc is met.",
    },
    {
        label: "jp hl",
        insertText: "jp hl",
        mnemonic: "jp",
        bytes: 1,
        cycles: "4",
        flags: "-",
        description: "Jump to address in HL; copy the value in HL into PC.",
        opcode: [0xE9],
    },

    // ========================================================================
    // JR
    // ========================================================================
    {
        label: "jr e8",
        insertText: "jr ${1:e8}",
        mnemonic: "jr",
        bytes: 2,
        cycles: "12",
        flags: "-",
        description: "Relative Jump by adding e8 to the address of the instruction following the JR.",
        opcode: [0x18],
    },
    {
        label: "jr cc, e8",
        insertText: "jr ${1|z,nz,c,nc|}, ${2:e8}",
        mnemonic: "jr",
        bytes: 2,
        cycles: "12/8",
        flags: "-",
        description: "Relative Jump by adding e8 to the current address if condition cc is met.",
    },

    // ========================================================================
    // LD — 8-bit
    // ========================================================================
    {
        label: "ld r8, r8",
        insertText: "ld ${1|a,b,c,d,e,h,l|}, ${2|a,b,c,d,e,h,l|}",
        mnemonic: "ld",
        bytes: 1,
        cycles: "4",
        flags: "-",
        description: "Copy the value in a register into another register.",
    },
    {
        label: "ld r8, n8",
        insertText: "ld ${1|a,b,c,d,e,h,l|}, ${2:n8}",
        mnemonic: "ld",
        bytes: 2,
        cycles: "8",
        flags: "-",
        description: "Load the value n8 into register r8.",
    },
    {
        label: "ld r16, n16",
        insertText: "ld ${1|bc,de,hl|}, ${2:n16}",
        mnemonic: "ld",
        bytes: 3,
        cycles: "12",
        flags: "-",
        description: "Load the value n16 into register r16.",
    },
    {
        label: "ld [hl], r8",
        insertText: "ld [hl], ${1|a,b,c,d,e,h,l|}",
        mnemonic: "ld",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Store the value in register r8 into the byte pointed to by HL.",
    },
    {
        label: "ld [hl], n8",
        insertText: "ld [hl], ${1:n8}",
        mnemonic: "ld",
        bytes: 2,
        cycles: "12",
        flags: "-",
        description: "Store the value n8 into the byte pointed to by HL.",
        opcode: [0x36],
    },
    {
        label: "ld r8, [hl]",
        insertText: "ld ${1|a,b,c,d,e,h,l|}, [hl]",
        mnemonic: "ld",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Load the value pointed to by HL into register r8.",
    },
    {
        label: "ld [r16], a",
        insertText: "ld [${1|bc,de,hl|}], a",
        mnemonic: "ld",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Store the value in A into the byte pointed to by r16.",
    },
    {
        label: "ld [n16], a",
        insertText: "ld [${1:n16}], a",
        mnemonic: "ld",
        bytes: 3,
        cycles: "16",
        flags: "-",
        description: "Store the value in A into the byte at address n16.",
        opcode: [0xEA],
    },
    {
        label: "ld [$ff00+c], a",
        insertText: "ld [\\$ff00+c], a",
        mnemonic: "ld",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Store A into the byte at address $FF00+C. Alternate spelling of `ldh [c], a`.",
        opcode: [0xE2],
    },
    {
        label: "ld a, [r16]",
        insertText: "ld a, [${1|bc,de,hl|}]",
        mnemonic: "ld",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Load the byte pointed to by r16 into A.",
    },
    {
        label: "ld a, [n16]",
        insertText: "ld a, [${1:n16}]",
        mnemonic: "ld",
        bytes: 3,
        cycles: "16",
        flags: "-",
        description: "Load the byte at address n16 into A.",
        opcode: [0xFA],
    },
    {
        label: "ld a, [$ff00+c]",
        insertText: "ld a, [\\$ff00+c]",
        mnemonic: "ld",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Load the byte at address $FF00+C into A. Alternate spelling of `ldh a, [c]`.",
        opcode: [0xF2],
    },
    {
        label: "ld [hli], a",
        insertText: "ld [hli], a",
        mnemonic: "ld",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Store A into the byte pointed to by HL and increment HL afterwards. Sometimes written as `ld [hl+], a` or `ldi [hl], a`.",
        opcode: [0x22],
    },
    {
        label: "ld [hld], a",
        insertText: "ld [hld], a",
        mnemonic: "ld",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Store A into the byte pointed to by HL and decrement HL afterwards. Sometimes written as `ld [hl-], a` or `ldd [hl], a`.",
        opcode: [0x32],
    },
    {
        label: "ld a, [hli]",
        insertText: "ld a, [hli]",
        mnemonic: "ld",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Load the byte pointed to by HL into A and increment HL afterwards. Sometimes written as `ld a, [hl+]` or `ldi a, [hl]`.",
        opcode: [0x2A],
    },
    {
        label: "ld a, [hld]",
        insertText: "ld a, [hld]",
        mnemonic: "ld",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Load the byte pointed to by HL into A and decrement HL afterwards. Sometimes written as `ld a, [hl-]` or `ldd a, [hl]`.",
        opcode: [0x3A],
    },
    {
        label: "ld sp, n16",
        insertText: "ld sp, ${1:n16}",
        mnemonic: "ld",
        bytes: 3,
        cycles: "12",
        flags: "-",
        description: "Load the value n16 into SP.",
        opcode: [0x31],
    },
    {
        label: "ld [n16], sp",
        insertText: "ld [${1:n16}], sp",
        mnemonic: "ld",
        bytes: 3,
        cycles: "20",
        flags: "-",
        description: "Store SP & $FF at address n16 and SP >> 8 at address n16 + 1.",
        opcode: [0x08],
    },
    {
        label: "ld hl, sp+e8",
        insertText: "ld hl, sp+${1:e8}",
        mnemonic: "ld",
        bytes: 2,
        cycles: "12",
        flags: "Z:0 N:0 H:? C:?",
        description: "Add the signed value e8 to SP and store the result in HL.",
        opcode: [0xF8],
    },
    {
        label: "ld sp, hl",
        insertText: "ld sp, hl",
        mnemonic: "ld",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Copy HL into SP.",
        opcode: [0xF9],
    },

    // ========================================================================
    // LDD / LDI — alternate mnemonics for ld [hld]/[hli]
    // ========================================================================
    {
        label: "ldd [hl], a",
        insertText: "ldd [hl], a",
        mnemonic: "ldd",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Store A into the byte pointed to by HL and decrement HL afterwards. Alternate mnemonic for `ld [hld], a`.",
        opcode: [0x32],
    },
    {
        label: "ldd a, [hl]",
        insertText: "ldd a, [hl]",
        mnemonic: "ldd",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Load the byte pointed to by HL into A and decrement HL afterwards. Alternate mnemonic for `ld a, [hld]`.",
        opcode: [0x3A],
    },
    {
        label: "ldi [hl], a",
        insertText: "ldi [hl], a",
        mnemonic: "ldi",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Store A into the byte pointed to by HL and increment HL afterwards. Alternate mnemonic for `ld [hli], a`.",
        opcode: [0x22],
    },
    {
        label: "ldi a, [hl]",
        insertText: "ldi a, [hl]",
        mnemonic: "ldi",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Load the byte pointed to by HL into A and increment HL afterwards. Alternate mnemonic for `ld a, [hli]`.",
        opcode: [0x2A],
    },

    // ========================================================================
    // LDH
    // ========================================================================
    {
        label: "ldh [n16], a",
        insertText: "ldh [${1:n16}], a",
        mnemonic: "ldh",
        bytes: 2,
        cycles: "12",
        flags: "-",
        description: "Store A into the byte at address n16, which must be between $FF00 and $FFFF.",
        opcode: [0xE0],
    },
    {
        label: "ldh [c], a",
        insertText: "ldh [c], a",
        mnemonic: "ldh",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Store A into the byte at address $FF00+C.",
        opcode: [0xE2],
    },
    {
        label: "ldh a, [n16]",
        insertText: "ldh a, [${1:n16}]",
        mnemonic: "ldh",
        bytes: 2,
        cycles: "12",
        flags: "-",
        description: "Load the byte at address n16 into A. Address must be between $FF00 and $FFFF.",
        opcode: [0xF0],
    },
    {
        label: "ldh a, [c]",
        insertText: "ldh a, [c]",
        mnemonic: "ldh",
        bytes: 1,
        cycles: "8",
        flags: "-",
        description: "Load the byte at address $FF00+C into A.",
        opcode: [0xF2],
    },

    // ========================================================================
    // NOP
    // ========================================================================
    {
        label: "nop",
        insertText: "nop",
        mnemonic: "nop",
        bytes: 1,
        cycles: "4",
        flags: "-",
        description: "No OPeration.",
        opcode: [0x00],
    },

    // ========================================================================
    // OR
    // ========================================================================
    {
        label: "or a, r8",
        insertText: "or a, ${1|a,b,c,d,e,h,l|}",
        mnemonic: "or",
        bytes: 1,
        cycles: "4",
        flags: "Z:? N:0 H:0 C:0",
        description: "Bitwise OR between the value in r8 and A.",
    },
    {
        label: "or a, [hl]",
        insertText: "or a, [hl]",
        mnemonic: "or",
        bytes: 1,
        cycles: "8",
        flags: "Z:? N:0 H:0 C:0",
        description: "Bitwise OR between the byte pointed to by HL and A.",
        opcode: [0xB6],
    },
    {
        label: "or a, n8",
        insertText: "or a, ${1:n8}",
        mnemonic: "or",
        bytes: 2,
        cycles: "8",
        flags: "Z:? N:0 H:0 C:0",
        description: "Bitwise OR between the value n8 and A.",
        opcode: [0xF6],
    },

    // ========================================================================
    // POP
    // ========================================================================
    {
        label: "pop af",
        insertText: "pop af",
        mnemonic: "pop",
        bytes: 1,
        cycles: "12",
        flags: "Z:? N:? H:? C:?",
        description: "Pop register AF from the stack. Restores all flags.",
        opcode: [0xF1],
    },
    {
        label: "pop r16",
        insertText: "pop ${1|bc,de,hl|}",
        mnemonic: "pop",
        bytes: 1,
        cycles: "12",
        flags: "-",
        description: "Pop register r16 from the stack.",
    },

    // ========================================================================
    // PUSH
    // ========================================================================
    {
        label: "push af",
        insertText: "push af",
        mnemonic: "push",
        bytes: 1,
        cycles: "16",
        flags: "-",
        description: "Push register AF onto the stack.",
        opcode: [0xF5],
    },
    {
        label: "push r16",
        insertText: "push ${1|bc,de,hl|}",
        mnemonic: "push",
        bytes: 1,
        cycles: "16",
        flags: "-",
        description: "Push register r16 onto the stack.",
    },

    // ========================================================================
    // RES
    // ========================================================================
    {
        label: "res u3, r8",
        insertText: "res ${1|0,1,2,3,4,5,6,7|}, ${2|a,b,c,d,e,h,l|}",
        mnemonic: "res",
        bytes: 2,
        cycles: "8",
        flags: "-",
        description: "Set bit u3 in register r8 to 0.",
    },
    {
        label: "res u3, [hl]",
        insertText: "res ${1|0,1,2,3,4,5,6,7|}, [hl]",
        mnemonic: "res",
        bytes: 2,
        cycles: "16",
        flags: "-",
        description: "Set bit u3 in the byte pointed to by HL to 0.",
    },

    // ========================================================================
    // RET
    // ========================================================================
    {
        label: "ret",
        insertText: "ret",
        mnemonic: "ret",
        bytes: 1,
        cycles: "16",
        flags: "-",
        description: "Return from subroutine. Pop PC from the stack.",
        opcode: [0xC9],
    },
    {
        label: "ret cc",
        insertText: "ret ${1|z,nz,c,nc|}",
        mnemonic: "ret",
        bytes: 1,
        cycles: "20/8",
        flags: "-",
        description: "Return from subroutine if condition cc is met.",
    },

    // ========================================================================
    // RETI
    // ========================================================================
    {
        label: "reti",
        insertText: "reti",
        mnemonic: "reti",
        bytes: 1,
        cycles: "16",
        flags: "-",
        description: "Return from subroutine and enable interrupts.",
        opcode: [0xD9],
    },

    // ========================================================================
    // RL
    // ========================================================================
    {
        label: "rl r8",
        insertText: "rl ${1|a,b,c,d,e,h,l|}",
        mnemonic: "rl",
        bytes: 2,
        cycles: "8",
        flags: "Z:? N:0 H:0 C:?",
        description: "Rotate bits in register r8 left through carry.",
    },
    {
        label: "rl [hl]",
        insertText: "rl [hl]",
        mnemonic: "rl",
        bytes: 2,
        cycles: "16",
        flags: "Z:? N:0 H:0 C:?",
        description: "Rotate the byte pointed to by HL left through carry.",
        opcode: [0xCB, 0x16],
    },

    // ========================================================================
    // RLA
    // ========================================================================
    {
        label: "rla",
        insertText: "rla",
        mnemonic: "rla",
        bytes: 1,
        cycles: "4",
        flags: "Z:0 N:0 H:0 C:?",
        description: "Rotate A left through carry.",
        opcode: [0x17],
    },

    // ========================================================================
    // RLC
    // ========================================================================
    {
        label: "rlc r8",
        insertText: "rlc ${1|a,b,c,d,e,h,l|}",
        mnemonic: "rlc",
        bytes: 2,
        cycles: "8",
        flags: "Z:? N:0 H:0 C:?",
        description: "Rotate register r8 left.",
    },
    {
        label: "rlc [hl]",
        insertText: "rlc [hl]",
        mnemonic: "rlc",
        bytes: 2,
        cycles: "16",
        flags: "Z:? N:0 H:0 C:?",
        description: "Rotate the byte pointed to by HL left.",
        opcode: [0xCB, 0x06],
    },

    // ========================================================================
    // RLCA
    // ========================================================================
    {
        label: "rlca",
        insertText: "rlca",
        mnemonic: "rlca",
        bytes: 1,
        cycles: "4",
        flags: "Z:0 N:0 H:0 C:?",
        description: "Rotate A left.",
        opcode: [0x07],
    },

    // ========================================================================
    // RR
    // ========================================================================
    {
        label: "rr r8",
        insertText: "rr ${1|a,b,c,d,e,h,l|}",
        mnemonic: "rr",
        bytes: 2,
        cycles: "8",
        flags: "Z:? N:0 H:0 C:?",
        description: "Rotate register r8 right through carry.",
    },
    {
        label: "rr [hl]",
        insertText: "rr [hl]",
        mnemonic: "rr",
        bytes: 2,
        cycles: "16",
        flags: "Z:? N:0 H:0 C:?",
        description: "Rotate the byte pointed to by HL right through carry.",
        opcode: [0xCB, 0x1E],
    },

    // ========================================================================
    // RRA
    // ========================================================================
    {
        label: "rra",
        insertText: "rra",
        mnemonic: "rra",
        bytes: 1,
        cycles: "4",
        flags: "Z:0 N:0 H:0 C:?",
        description: "Rotate A right through carry.",
        opcode: [0x1F],
    },

    // ========================================================================
    // RRC
    // ========================================================================
    {
        label: "rrc r8",
        insertText: "rrc ${1|a,b,c,d,e,h,l|}",
        mnemonic: "rrc",
        bytes: 2,
        cycles: "8",
        flags: "Z:? N:0 H:0 C:?",
        description: "Rotate register r8 right.",
    },
    {
        label: "rrc [hl]",
        insertText: "rrc [hl]",
        mnemonic: "rrc",
        bytes: 2,
        cycles: "16",
        flags: "Z:? N:0 H:0 C:?",
        description: "Rotate the byte pointed to by HL right.",
        opcode: [0xCB, 0x0E],
    },

    // ========================================================================
    // RRCA
    // ========================================================================
    {
        label: "rrca",
        insertText: "rrca",
        mnemonic: "rrca",
        bytes: 1,
        cycles: "4",
        flags: "Z:0 N:0 H:0 C:?",
        description: "Rotate A right.",
        opcode: [0x0F],
    },

    // ========================================================================
    // RST
    // ========================================================================
    {
        label: "rst vec",
        insertText: "rst ${1|\\$00,\\$08,\\$10,\\$18,\\$20,\\$28,\\$30,\\$38|}",
        mnemonic: "rst",
        bytes: 1,
        cycles: "16",
        flags: "-",
        description: "Call address vec. Shorter and faster equivalent to CALL for suitable values of vec.",
    },

    // ========================================================================
    // SBC
    // ========================================================================
    {
        label: "sbc a, r8",
        insertText: "sbc a, ${1|a,b,c,d,e,h,l|}",
        mnemonic: "sbc",
        bytes: 1,
        cycles: "4",
        flags: "Z:? N:1 H:? C:?",
        description: "Subtract the value in r8 and the carry flag from A.",
    },
    {
        label: "sbc a, [hl]",
        insertText: "sbc a, [hl]",
        mnemonic: "sbc",
        bytes: 1,
        cycles: "8",
        flags: "Z:? N:1 H:? C:?",
        description: "Subtract the byte pointed to by HL and the carry flag from A.",
        opcode: [0x9E],
    },
    {
        label: "sbc a, n8",
        insertText: "sbc a, ${1:n8}",
        mnemonic: "sbc",
        bytes: 2,
        cycles: "8",
        flags: "Z:? N:1 H:? C:?",
        description: "Subtract the value n8 and the carry flag from A.",
        opcode: [0xDE],
    },

    // ========================================================================
    // SCF
    // ========================================================================
    {
        label: "scf",
        insertText: "scf",
        mnemonic: "scf",
        bytes: 1,
        cycles: "4",
        flags: "Z:- N:0 H:0 C:1",
        description: "Set Carry Flag.",
        opcode: [0x37],
    },

    // ========================================================================
    // SET
    // ========================================================================
    {
        label: "set u3, r8",
        insertText: "set ${1|0,1,2,3,4,5,6,7|}, ${2|a,b,c,d,e,h,l|}",
        mnemonic: "set",
        bytes: 2,
        cycles: "8",
        flags: "-",
        description: "Set bit u3 in register r8 to 1.",
    },
    {
        label: "set u3, [hl]",
        insertText: "set ${1|0,1,2,3,4,5,6,7|}, [hl]",
        mnemonic: "set",
        bytes: 2,
        cycles: "16",
        flags: "-",
        description: "Set bit u3 in the byte pointed to by HL to 1.",
    },

    // ========================================================================
    // SLA
    // ========================================================================
    {
        label: "sla r8",
        insertText: "sla ${1|a,b,c,d,e,h,l|}",
        mnemonic: "sla",
        bytes: 2,
        cycles: "8",
        flags: "Z:? N:0 H:0 C:?",
        description: "Shift Left Arithmetically register r8.",
    },
    {
        label: "sla [hl]",
        insertText: "sla [hl]",
        mnemonic: "sla",
        bytes: 2,
        cycles: "16",
        flags: "Z:? N:0 H:0 C:?",
        description: "Shift Left Arithmetically the byte pointed to by HL.",
        opcode: [0xCB, 0x26],
    },

    // ========================================================================
    // SRA
    // ========================================================================
    {
        label: "sra r8",
        insertText: "sra ${1|a,b,c,d,e,h,l|}",
        mnemonic: "sra",
        bytes: 2,
        cycles: "8",
        flags: "Z:? N:0 H:0 C:?",
        description: "Shift Right Arithmetically register r8 (bit 7 unchanged).",
    },
    {
        label: "sra [hl]",
        insertText: "sra [hl]",
        mnemonic: "sra",
        bytes: 2,
        cycles: "16",
        flags: "Z:? N:0 H:0 C:?",
        description: "Shift Right Arithmetically the byte pointed to by HL (bit 7 unchanged).",
        opcode: [0xCB, 0x2E],
    },

    // ========================================================================
    // SRL
    // ========================================================================
    {
        label: "srl r8",
        insertText: "srl ${1|a,b,c,d,e,h,l|}",
        mnemonic: "srl",
        bytes: 2,
        cycles: "8",
        flags: "Z:? N:0 H:0 C:?",
        description: "Shift Right Logically register r8.",
    },
    {
        label: "srl [hl]",
        insertText: "srl [hl]",
        mnemonic: "srl",
        bytes: 2,
        cycles: "16",
        flags: "Z:? N:0 H:0 C:?",
        description: "Shift Right Logically the byte pointed to by HL.",
        opcode: [0xCB, 0x3E],
    },

    // ========================================================================
    // STOP
    // ========================================================================
    {
        label: "stop",
        insertText: "stop",
        mnemonic: "stop",
        bytes: 2,
        cycles: "4",
        flags: "-",
        description: "Enter CPU very low power mode. Also used to switch between double and normal speed modes on GBC.",
        opcode: [0x10, 0x00],
    },

    // ========================================================================
    // SUB
    // ========================================================================
    {
        label: "sub a, r8",
        insertText: "sub a, ${1|a,b,c,d,e,h,l|}",
        mnemonic: "sub",
        bytes: 1,
        cycles: "4",
        flags: "Z:? N:1 H:? C:?",
        description: "Subtract the value in r8 from A.",
    },
    {
        label: "sub a, [hl]",
        insertText: "sub a, [hl]",
        mnemonic: "sub",
        bytes: 1,
        cycles: "8",
        flags: "Z:? N:1 H:? C:?",
        description: "Subtract the byte pointed to by HL from A.",
        opcode: [0x96],
    },
    {
        label: "sub a, n8",
        insertText: "sub a, ${1:n8}",
        mnemonic: "sub",
        bytes: 2,
        cycles: "8",
        flags: "Z:? N:1 H:? C:?",
        description: "Subtract the value n8 from A.",
        opcode: [0xD6],
    },

    // ========================================================================
    // SWAP
    // ========================================================================
    {
        label: "swap r8",
        insertText: "swap ${1|a,b,c,d,e,h,l|}",
        mnemonic: "swap",
        bytes: 2,
        cycles: "8",
        flags: "Z:? N:0 H:0 C:0",
        description: "Swap the upper 4 bits in register r8 and the lower 4 ones.",
    },
    {
        label: "swap [hl]",
        insertText: "swap [hl]",
        mnemonic: "swap",
        bytes: 2,
        cycles: "16",
        flags: "Z:? N:0 H:0 C:0",
        description: "Swap the upper 4 bits in the byte pointed to by HL and the lower 4 ones.",
        opcode: [0xCB, 0x36],
    },

    // ========================================================================
    // XOR
    // ========================================================================
    {
        label: "xor a, r8",
        insertText: "xor a, ${1|a,b,c,d,e,h,l|}",
        mnemonic: "xor",
        bytes: 1,
        cycles: "4",
        flags: "Z:? N:0 H:0 C:0",
        description: "Bitwise XOR between the value in r8 and A.",
    },
    {
        label: "xor a, [hl]",
        insertText: "xor a, [hl]",
        mnemonic: "xor",
        bytes: 1,
        cycles: "8",
        flags: "Z:? N:0 H:0 C:0",
        description: "Bitwise XOR between the byte pointed to by HL and A.",
        opcode: [0xAE],
    },
    {
        label: "xor a, n8",
        insertText: "xor a, ${1:n8}",
        mnemonic: "xor",
        bytes: 2,
        cycles: "8",
        flags: "Z:? N:0 H:0 C:0",
        description: "Bitwise XOR between the value n8 and A.",
        opcode: [0xEE],
    },
];

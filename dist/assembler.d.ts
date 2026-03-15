declare class Assembler {
    private machine_code_output;
    private current_symbol_address;
    private symbol_table;
    private last_instruction_key;
    private last_instruction;
    private MAX_ADDRESS;
    private static instance;
    private constructor();
    static getInstance(assemblyFile: string): Assembler;
    parse(assemblyFile: string): void;
    private first_pass;
    private get_machine_code;
    private get_a_instruction_machine_code;
    private get_c_instruction_machine_code;
    private isAInstruction;
    private split_instruction;
    private get_first_composed_op;
    private is_empty_instruction;
    private should_be_ignored;
    private is_illegal_operation;
    private is_invalid_instruction;
    private is_valid_address;
    private get_instructions;
    private is_label;
    private get_clean_instruction;
    getMachineCodeOutput(): string[];
    print_machine_code(): void;
    /**
     * Assemble the given assembly string and return machine code lines.
     * Creates a new instance per call. Throws on invalid assembly.
     */
    static assemble(assembly: string): string[];
}
export default Assembler;
//# sourceMappingURL=assembler.d.ts.map
import ISA from "./ISA.js";
import ignores from "./ignores.js";
import symbolTable from "./symbol-table.js";
class Assembler {
    constructor(assemblyFile) {
        this.machine_code_output = [];
        this.current_symbol_address = 16;
        this.last_instruction_key = null;
        this.last_instruction = "";
        this.MAX_ADDRESS = 32768;
        this.symbol_table = { ...symbolTable };
        this.first_pass(assemblyFile);
    }
    static getInstance(assemblyFile) {
        if (!Assembler.instance) {
            Assembler.instance = new Assembler(assemblyFile);
        }
        return Assembler.instance;
    }
    parse(assemblyFile) {
        const instructions = this.get_instructions(assemblyFile);
        instructions.forEach((instruction) => {
            if (this.is_illegal_operation(instruction)) {
                throw new Error(`Illegal operation: two consecutive A-instructions ${this.last_instruction} ${instruction}`);
            }
            else if (this.is_invalid_instruction(instruction) ||
                this.is_label(instruction)) {
                // ignore
            }
            else {
                if (this.isAInstruction(instruction)) {
                    this.last_instruction_key = "A";
                    this.last_instruction = instruction;
                }
                else {
                    this.last_instruction_key = "C";
                    this.last_instruction = instruction.split(" ")[0] ?? instruction;
                }
                const machine_code = this.get_machine_code(this.last_instruction);
                this.machine_code_output.push(machine_code);
            }
        });
    }
    first_pass(assemblyFile) {
        let current_memory_address = 0;
        const instructions = this.get_instructions(assemblyFile);
        instructions.forEach((instruction) => {
            if (this.is_illegal_operation(instruction)) {
                throw new Error(`Illegal operation: two consecutive A-instructions ${this.last_instruction} ${instruction}`);
            }
            else if (this.is_invalid_instruction(instruction)) {
                // ignore
            }
            else {
                if (this.is_label(instruction)) {
                    const label = instruction.slice(1, -1);
                    if (label in this.symbol_table) {
                        throw new Error(`Duplicate label: ${label} already exists in the symbol table with address ${this.symbol_table[label]}`);
                    }
                    this.symbol_table[label] = current_memory_address;
                }
                else {
                    current_memory_address++;
                }
            }
        });
    }
    get_machine_code(instruction) {
        if (this.isAInstruction(instruction)) {
            return this.get_a_instruction_machine_code(instruction);
        }
        else {
            return this.get_c_instruction_machine_code(instruction);
        }
    }
    get_a_instruction_machine_code(instruction) {
        const _instruction = this.get_clean_instruction(instruction);
        const value = _instruction.slice(1);
        let actual_value = value;
        if (isNaN(Number(value))) {
            if (value in this.symbol_table) {
                actual_value = this.symbol_table[value];
            }
            else {
                if (this.is_valid_address(this.current_symbol_address)) {
                    throw new Error(`Symbol table overflow: cannot assign address ${this.current_symbol_address} to symbol ${value} | This is screen I/O memory address(memory mapping)`);
                }
                actual_value = this.current_symbol_address++;
                this.symbol_table[value] = this.current_symbol_address;
            }
        }
        const binaryValue = Number(actual_value).toString(2).padStart(16, "0");
        return binaryValue;
    }
    get_c_instruction_machine_code(instruction) {
        /**
         * C-instruction format:
         * 1. dest=comp;jmp
         * 2. dest=comp
         * 3. comp;jmp
         * 4. comp
         *
         */
        let dest = "null";
        let comp = "0";
        let jmp = "null";
        let abit = 0;
        const _instruction = this.get_clean_instruction(instruction);
        const has_dest = _instruction.includes("=");
        const has_jump = _instruction.includes(";");
        if (has_jump && has_dest) {
            const [dest_part, jump_part] = _instruction.split(";");
            const [dest_key, comp_key] = dest_part.split("=");
            dest = dest_key;
            comp = comp_key;
            jmp = jump_part;
        }
        else if (has_dest && !has_jump) {
            const [dest_key, comp_key] = _instruction.split("=");
            dest = dest_key;
            comp = comp_key;
        }
        else if (has_jump && !has_dest) {
            const [comp_key, jump_key] = _instruction.split(";");
            comp = comp_key;
            jmp = jump_key;
        }
        if (comp.includes("M")) {
            abit = 1;
        }
        const machine_code = abit.toString() +
            ISA.C_INSTRUCTION.comp[comp] +
            ISA.C_INSTRUCTION.dest[dest] +
            ISA.C_INSTRUCTION.jump[jmp];
        return machine_code.padStart(16, "1");
    }
    isAInstruction(instruction) {
        const _instruction = this.get_clean_instruction(instruction);
        return _instruction[0] === "@";
    }
    split_instruction(instruction) {
        return instruction.split(" ") ?? [""];
    }
    get_first_composed_op(instruction) {
        const _instruction = this.get_clean_instruction(instruction);
        const splittedOP = this.split_instruction(_instruction);
        return splittedOP[0] ?? "";
    }
    is_empty_instruction(instruction) {
        const _instruction = this.get_clean_instruction(instruction);
        return !_instruction.length;
    }
    should_be_ignored(instruction) {
        const _instruction = this.get_clean_instruction(instruction);
        return ignores.includes(this.get_first_composed_op(_instruction));
    }
    is_illegal_operation(instruction) {
        const _instruction = this.get_clean_instruction(instruction);
        return (this.isAInstruction(_instruction) && this.last_instruction_key === "A");
    }
    is_invalid_instruction(instruction) {
        const _instruction = this.get_clean_instruction(instruction);
        return (this.is_empty_instruction(_instruction) ||
            this.should_be_ignored(_instruction));
    }
    is_valid_address(address) {
        return isNaN(Number(address)) || address >= this.MAX_ADDRESS;
    }
    get_instructions(assemblyFile) {
        return assemblyFile.split("\n");
    }
    is_label(instruction) {
        const _instruction = this.get_clean_instruction(instruction);
        return (_instruction[0] === "(" && _instruction[_instruction.length - 1] === ")");
    }
    get_clean_instruction(instruction) {
        return instruction.trim().split(" ")[0] ?? instruction;
    }
    getMachineCodeOutput() {
        return this.machine_code_output;
    }
    print_machine_code() {
        console.log("================================");
        console.log(this.machine_code_output.join("\n"));
        console.log("================================");
    }
    /**
     * Assemble the given assembly string and return machine code lines.
     * Creates a new instance per call. Throws on invalid assembly.
     */
    static assemble(assembly) {
        const instance = new Assembler(assembly);
        instance.parse(assembly);
        return instance.getMachineCodeOutput();
    }
}
export default Assembler;
//# sourceMappingURL=assembler.js.map
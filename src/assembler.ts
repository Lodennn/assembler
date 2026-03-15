import ISA from "./ISA.js";
import ignores from "./ignores.js";
import type { CompKeys, DestKeys, JumpKeys, Operation } from "./types.js";
import symbolTable from "./symbol-table.js";

class Assembler {
  private machine_code_output: string[] = [];
  private current_symbol_address: number = 16;
  private symbol_table: Record<string, number> = symbolTable;
  private last_instruction_key: Operation | null = null;
  private last_instruction: string = "";
  private MAX_ADDRESS = 32768;

  private static instance: Assembler;

  private constructor(assemblyFile: string) {
    // Read the file
    this.first_pass(assemblyFile);
    console.log(this.symbol_table);
  }

  public static getInstance(assemblyFile: string): Assembler {
    if (!Assembler.instance) {
      Assembler.instance = new Assembler(assemblyFile);
    }
    return Assembler.instance;
  }

  parse(assemblyFile: string) {
    const instructions = this.get_instructions(assemblyFile);
    instructions.forEach((instruction: string) => {
      if (this.is_illegal_operation(instruction)) {
        throw new Error(
          `Illegal operation: two consecutive A-instructions ${this.last_instruction} ${instruction}`
        );
      } else if (
        this.is_invalid_instruction(instruction) ||
        this.is_label(instruction)
      ) {
        // ignore
      } else {
        if (this.isAInstruction(instruction)) {
          //   console.log("A-instruction", instruction);
          this.last_instruction_key = "A";
          this.last_instruction = instruction;
        } else {
          this.last_instruction_key = "C";
          this.last_instruction = instruction.split(" ")[0] ?? instruction;
        }
        const machine_code = this.get_machine_code(this.last_instruction);
        this.machine_code_output.push(machine_code);
      }
    });
  }

  private first_pass(assemblyFile: string) {
    let current_memory_address: number = 0;
    const instructions = this.get_instructions(assemblyFile);
    instructions.forEach((instruction: string) => {
      if (this.is_illegal_operation(instruction)) {
        throw new Error(
          `Illegal operation: two consecutive A-instructions ${this.last_instruction} ${instruction}`
        );
      } else if (this.is_invalid_instruction(instruction)) {
        // ignore
      } else {
        if (this.is_label(instruction)) {
          const label = instruction.slice(1, -1);
          if (label in this.symbol_table) {
            throw new Error(
              `Duplicate label: ${label} already exists in the symbol table with address ${this.symbol_table[label]}`
            );
          }
          this.symbol_table[label] = current_memory_address;
        } else {
          current_memory_address++;
        }
      }
    });
  }

  private get_machine_code(instruction: string): string {
    if (this.isAInstruction(instruction)) {
      return this.get_a_instruction_machine_code(instruction);
    } else {
      return this.get_c_instruction_machine_code(instruction);
    }
  }

  private get_a_instruction_machine_code(instruction: string): string {
    const value = instruction.slice(1);
    let actual_value: string | number = value;
    if (isNaN(Number(value))) {
      if (value in this.symbol_table) {
        actual_value = this.symbol_table[value]!;
      } else {
        if (this.is_valid_address(this.current_symbol_address)) {
          throw new Error(
            `Symbol table overflow: cannot assign address ${this.current_symbol_address} to symbol ${value} | This is screen I/O memory address(memory mapping)`
          );
        }
        actual_value = this.current_symbol_address++;
        this.symbol_table[value] = this.current_symbol_address;
      }
    }
    const binaryValue = Number(actual_value).toString(2).padStart(16, "0");
    return binaryValue;
  }

  private get_c_instruction_machine_code(instruction: string): string {
    /**
     * C-instruction format:
     * 1. dest=comp;jmp
     * 2. dest=comp
     * 3. comp;jmp
     * 4. comp
     *
     */
    let dest: DestKeys = "null";
    let comp: CompKeys = "0";
    let jmp: JumpKeys = "null";
    let abit: 0 | 1 = 0;

    const clean_c_instruction = instruction.split(" ")[0] ?? instruction;

    const has_dest = clean_c_instruction.includes("=");
    const has_jump = clean_c_instruction.includes(";");

    if (has_jump && has_dest) {
      const [dest_part, jump_part] = clean_c_instruction.split(";");
      const [dest_key, comp_key] = dest_part!.split("=");
      dest = dest_key as DestKeys;
      comp = comp_key as CompKeys;
      jmp = jump_part as JumpKeys;
    } else if (has_dest && !has_jump) {
      const [dest_key, comp_key] = clean_c_instruction.split("=");
      dest = dest_key as DestKeys;
      comp = comp_key as CompKeys;
    } else if (has_jump && !has_dest) {
      const [comp_key, jump_key] = clean_c_instruction.split(";");
      comp = comp_key as CompKeys;
      jmp = jump_key as JumpKeys;
    }

    if (comp.includes("M")) {
      abit = 1;
    }

    const machine_code =
      abit.toString() +
      ISA.C_INSTRUCTION.comp[comp] +
      ISA.C_INSTRUCTION.dest[dest] +
      ISA.C_INSTRUCTION.jump[jmp];

    return machine_code.padStart(16, "1");
  }

  private isAInstruction(instruction: string): boolean {
    return instruction[0] === "@";
  }

  private split_instruction(instruction: string) {
    return instruction.split(" ") ?? [""];
  }

  private get_first_composed_op(instruction: string): string {
    const splittedOP = this.split_instruction(instruction);
    return splittedOP[0] ?? "";
  }

  private is_empty_instruction(instruction: string): boolean {
    return !instruction.length;
  }

  private should_be_ignored(instruction: string): boolean {
    return ignores.includes(this.get_first_composed_op(instruction));
  }

  private is_illegal_operation(instruction: string): boolean {
    return (
      this.isAInstruction(instruction) && this.last_instruction_key === "A"
    );
  }

  private is_invalid_instruction(instruction: string): boolean {
    return (
      this.is_empty_instruction(instruction) ||
      this.should_be_ignored(instruction)
    );
  }

  private is_valid_address(address: number): boolean {
    return isNaN(Number(address)) || address >= this.MAX_ADDRESS;
  }

  private get_instructions(assemblyFile: string): string[] {
    return assemblyFile.split("\n");
  }

  private is_label(instruction: string): boolean {
    return (
      instruction[0] === "(" && instruction[instruction.length - 1] === ")"
    );
  }

  print_machine_code() {
    console.log("================================");
    console.log(this.machine_code_output.join("\n"));
    console.log("================================");
  }
}

export default Assembler;

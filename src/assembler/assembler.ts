import ISA from "./ISA.js";
import type { CompKeys, DestKeys, JumpKeys, Operation } from "./types.js";
import symbolTable from "./symbol-table.js";
import Reader from "../reader/index.js";
import { OperationEnum } from "./types.js";

class Assembler {
  private machine_code_output: string[] = [];
  private current_symbol_address: number = 16;
  private symbol_table: Record<string, number>;
  private last_instruction_key: Operation | null = null;
  private last_instruction: string = "";
  private MAX_ADDRESS = 32768;
  private reader: Reader = new Reader();

  private static instance: Assembler;

  private constructor(assemblyFile: string) {
    this.symbol_table = { ...symbolTable };
    this.first_pass(assemblyFile);
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
      if (this.is_illegal_instruction(instruction)) {
        // will throw an error in is_illegal_instruction
        throw new Error(`Illegal instruction: ${instruction}`);
      } else if (
        this.is_ignored_instruction(instruction) ||
        this.is_label(instruction)
      ) {
        // ignore
      } else {
        if (this.is_a_instruction(instruction)) {
          this.last_instruction_key = OperationEnum.A;
          this.last_instruction = instruction;
        } else {
          this.last_instruction_key = OperationEnum.C;
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
      if (this.is_illegal_instruction(instruction)) {
        // will throw an error in is_illegal_instruction
      } else if (this.is_ignored_instruction(instruction)) {
        // ignore
      } else {
        if (this.is_label(instruction)) {
          const label = instruction.slice(1, -1);
          if (label in this.symbol_table) {
            throw new Error(
              `Duplicate label: ${label} already exists in the symbol table with address ${this.symbol_table[label]}`,
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
    if (this.is_a_instruction(instruction)) {
      return this.get_a_instruction_machine_code(instruction);
    } else {
      return this.get_c_instruction_machine_code(instruction);
    }
  }

  private get_a_instruction_machine_code(instruction: string): string {
    const _instruction = this.reader.get_clean_instruction(instruction);

    const value = _instruction.slice(1);
    let actual_value: string | number = value;
    if (isNaN(Number(value))) {
      if (value in this.symbol_table) {
        actual_value = this.symbol_table[value]!;
      } else {
        if (this.is_valid_address(this.current_symbol_address)) {
          throw new Error(
            `Symbol table overflow: cannot assign address ${this.current_symbol_address} to symbol ${value} | This is screen I/O memory address(memory mapping)`,
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

    const _instruction = this.reader.get_clean_instruction(instruction);

    const has_dest = _instruction.includes("=");
    const has_jump = _instruction.includes(";");

    if (has_jump && has_dest) {
      const [dest_part, jump_part] = _instruction.split(";");
      const [dest_key, comp_key] = dest_part!.split("=");
      dest = dest_key as DestKeys;
      comp = comp_key as CompKeys;
      jmp = jump_part as JumpKeys;
    } else if (has_dest && !has_jump) {
      const [dest_key, comp_key] = _instruction.split("=");
      dest = dest_key as DestKeys;
      comp = comp_key as CompKeys;
    } else if (has_jump && !has_dest) {
      const [comp_key, jump_key] = _instruction.split(";");
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

  private is_a_instruction(instruction: string): boolean {
    const _instruction = this.reader.get_clean_instruction(instruction);

    return _instruction[0] === "@";
  }

  private split_instruction(instruction: string) {
    return instruction.split(" ") ?? [""];
  }

  private get_first_composed_op(instruction: string): string {
    const _instruction = this.reader.get_clean_instruction(instruction);

    const splittedOP = this.split_instruction(_instruction);
    return this.is_comment(_instruction) ? "//" : (splittedOP[0] ?? "");
  }

  private is_comment(instruction: string): boolean {
    const _instruction = this.reader.get_clean_instruction(instruction);
    return _instruction.startsWith("//");
  }

  private is_illegal_instruction(instruction: string): boolean {
    const _instruction = this.reader.get_clean_instruction(instruction);
    const first_composed_op = this.get_first_composed_op(_instruction);
    if (this.reader.should_be_ignored(first_composed_op)) {
      return false;
    } else if (
      !this.is_a_instruction(_instruction) &&
      !this.is_c_instruction(_instruction) &&
      !this.is_label(_instruction)
    ) {
      return true;
    } else if (
      this.is_a_instruction(_instruction) &&
      this.last_instruction_key === OperationEnum.A
    ) {
      return true;
    }
    return false;
  }

  private is_ignored_instruction(instruction: string): boolean {
    const _instruction = this.reader.get_clean_instruction(instruction);
    const first_composed_op = this.get_first_composed_op(_instruction);
    return (
      this.reader.is_empty_instruction(_instruction) ||
      this.reader.should_be_ignored(first_composed_op)
    );
  }

  private is_valid_address(address: number): boolean {
    return isNaN(Number(address)) || address >= this.MAX_ADDRESS;
  }

  private get_instructions(assemblyFile: string): string[] {
    return assemblyFile.split("\n");
  }

  private is_label(instruction: string): boolean {
    const _instruction = this.reader.get_clean_instruction(instruction);
    return (
      _instruction[0] === "(" && _instruction[_instruction.length - 1] === ")"
    );
  }

  public getMachineCodeOutput(): string[] {
    return this.machine_code_output;
  }

  private is_c_instruction(instruction: string): boolean {
    const _instruction = this.reader.get_clean_instruction(instruction);
    if (!_instruction) return false;

    let dest = "null";
    let comp = "";
    let jmp = "null";

    // 1. Handle Destination (anything before '=')
    let remaining = _instruction;
    if (remaining.includes("=")) {
      const parts = remaining.split("=");
      dest = parts[0] || "";
      remaining = parts[1] || "";
    }

    // 2. Handle Jump (anything after ';')
    if (remaining.includes(";")) {
      const parts = remaining.split(";");
      comp = parts[0] || "";
      jmp = parts[1] || "";
    } else {
      comp = remaining; // If no semicolon, what's left is the computation
    }

    // 3. Final Validation
    const validDest = dest in ISA.C_INSTRUCTION.dest;
    const validComp = comp in ISA.C_INSTRUCTION.comp;
    const validJump = jmp in ISA.C_INSTRUCTION.jump;

    return validDest && validComp && validJump;
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
  public static assemble(assembly: string): string[] {
    const instance = new Assembler(assembly);
    instance.parse(assembly);
    return instance.getMachineCodeOutput();
  }
}

export default Assembler;

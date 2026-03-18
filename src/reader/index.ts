import ignores from "./ignores.js";

class Reader {
  constructor() {}

  get_clean_instruction(instruction: string): string {
    return instruction.trim().split(" ")[0] ?? instruction;
  }

  is_empty_instruction(instruction: string): boolean {
    const _instruction = this.get_clean_instruction(instruction);
    return !_instruction.length;
  }

  should_be_ignored(first_composed_op: string): boolean {
    return ignores.includes(first_composed_op);
  }
}

export default Reader;

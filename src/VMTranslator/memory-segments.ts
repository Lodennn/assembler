import { MEMORY_ACCESS_OPERATORS, MEMORY_SEGMENTS } from "./constants.js";
import { type TMemoryAccessCommand } from "./types.js";

class MemorySegments {
  private static instance: MemorySegments;

  private constructor() {}

  public static getInstance(): MemorySegments {
    if (!MemorySegments.instance) {
      MemorySegments.instance = new MemorySegments();
    }
    return MemorySegments.instance;
  }

  public parse_memory_access_command(command: string): TMemoryAccessCommand {
    if (
      this.is_empty_command(command) ||
      this.is_invalid_memory_access_command(command) ||
      this.is_invalid_memory_access_operation(command) ||
      this.is_invalid_memory_segment(command)
    ) {
      throw new Error(`Invalid memory access command: ${command}`);
    }

    const _command = this.get_clean_command(command);
    return {
      operation: _command[0]!,
      segment: _command[1]!,
      address: _command[2]!,
    };
  }

  public is_invalid_memory_access_command(command: string): boolean {
    const _command = this.get_clean_command(command);
    if (_command.length < 3 || !_command[0] || !_command[1] || !_command[2])
      return true;
    return false;
  }

  public is_invalid_memory_access_operation(command: string): boolean {
    const _command = this.get_clean_command(command);
    try {
      if (!_command[0] || !(_command[0] in MEMORY_ACCESS_OPERATORS))
        return true;
      return false;
    } catch (error) {
      console.error(error);
      return true;
    }
  }

  public is_invalid_memory_segment(command: string): boolean {
    const _command = this.get_clean_command(command);
    const segment = _command[1]!;
    if (!(segment in MEMORY_SEGMENTS)) return true;
    return false;
  }

  private get_clean_command(command: string) {
    return command.trim().split(" ");
  }
  private is_empty_command(command: string): boolean {
    return command.trim().length === 0;
  }
}

export default MemorySegments;

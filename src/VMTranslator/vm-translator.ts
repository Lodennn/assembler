import GlobalStack from "./global-stack.js";
import { MemorySegmentsEnum, type TInitMemorySetter } from "./types.js";
import MemorySegments from "./memory-segments.js";
import { SEGMENT_BASE, STATIC_BASE, TEMP_BASE } from "./constants.js";

class VMTranslator {
  private vmFile: string = "";
  private global_stack: GlobalStack = GlobalStack.getInstance();
  private memory_segments: MemorySegments = MemorySegments.getInstance();
  private output: string[] = [];

  constructor(vmFile: string) {
    this.vmFile = vmFile;
    this.init_memory();
    this.push("push constant 5");
    this.push("push static 10");
    this.push("push local 10");
    this.pop("pop argument 10");
    console.log("VM -> Assembly OUTPUT:\n", this.get_output());
  }

  // ─────────────────────────────────────────────
  // Bootstrap: set SP=256, LCL=300, ARG=400, etc.
  // These are assembly instructions that write
  // initial values into RAM[0..4].
  // They do NOT push anything onto the real stack.
  // ─────────────────────────────────────────────
  private init_memory() {
    const init_code: TInitMemorySetter[] = [
      { label: "SP", address: 0, value: 256 },
      { label: "LCL", address: 1, value: 300 },
      { label: "ARG", address: 2, value: 400 },
      { label: "THIS", address: 3, value: 3000 },
      { label: "THAT", address: 4, value: 3010 },
    ];
    init_code.forEach((setter) => this.set(setter));
  }

  private set(init_memory_setter: TInitMemorySetter) {
    // @value → D=A → @LABEL → M=D
    // This writes `value` into the register (e.g. SP, LCL...)
    // It does NOT touch the stack itself.
    let code = "";
    code += `@${init_memory_setter.value}\n`;
    code += `D=A\n`;
    code += `@${init_memory_setter.label}\n`;
    code += `M=D\n`;
    this.output.push(code);
    // NOTE: we do NOT push to global_stack here —
    // these are pointer registers, not stack values.
  }

  // ─────────────────────────────────────────────
  // PUSH
  // ─────────────────────────────────────────────
  private push(command: string) {
    const { operation, segment, address } =
      this.memory_segments.parse_memory_access_command(command);

    const index = Number(address);
    let code = "";

    if (segment === MemorySegmentsEnum.constant) {
      // push constant i → push literal value i
      // @i / D=A / @SP / A=M / M=D / @SP / M=M+1
      code += `@${index}\n`;
      code += `D=A\n`;
      code += `@SP\n`;
      code += `A=M\n`;
      code += `M=D\n`;
      code += `@SP\n`;
      code += `M=M+1\n`;

      this.global_stack.push(index);
    } else if (segment === MemorySegmentsEnum.static) {
      // push static i → push RAM[16 + i]
      // static variables live at fixed addresses starting at RAM[16]
      const staticAddr = STATIC_BASE + index;
      code += `@${staticAddr}\n`;
      code += `D=M\n`;
      code += `@SP\n`;
      code += `A=M\n`;
      code += `M=D\n`;
      code += `@SP\n`;
      code += `M=M+1\n`;

      this.global_stack.push(0); // value unknown at translate time
    } else if (segment === MemorySegmentsEnum.temp) {
      // push temp i → push RAM[5 + i]
      // temp is fixed at RAM[5..12], no pointer needed
      const tempAddr = TEMP_BASE + index;
      code += `@${tempAddr}\n`;
      code += `D=M\n`;
      code += `@SP\n`;
      code += `A=M\n`;
      code += `M=D\n`;
      code += `@SP\n`;
      code += `M=M+1\n`;

      this.global_stack.push(0);
    } else if (segment === MemorySegmentsEnum.pointer) {
      // push pointer 0 → push THIS (RAM[3])
      // push pointer 1 → push THAT (RAM[4])
      const pointerAddr = index === 0 ? "THIS" : "THAT";
      code += `@${pointerAddr}\n`;
      code += `D=M\n`;
      code += `@SP\n`;
      code += `A=M\n`;
      code += `M=D\n`;
      code += `@SP\n`;
      code += `M=M+1\n`;

      this.global_stack.push(0);
    } else {
      // push local/argument/this/that i
      // addr = base + i → push RAM[addr]
      // @i / D=A / @BASE / A=D+M / D=M / @SP / A=M / M=D / @SP / M=M+1
      const base = SEGMENT_BASE[segment]!;
      code += `@${index}\n`;
      code += `D=A\n`;
      code += `@${base}\n`;
      code += `A=D+M\n`; // go to RAM[base + index]
      code += `D=M\n`; // read the value there
      code += `@SP\n`;
      code += `A=M\n`;
      code += `M=D\n`;
      code += `@SP\n`;
      code += `M=M+1\n`; // always increment SP, never the base register!

      this.global_stack.push(0);
    }

    console.log("Parsed push command:", { operation, segment, address });
    this.output.push(code);
  }

  // ─────────────────────────────────────────────
  // POP
  // ─────────────────────────────────────────────
  private pop(command: string) {
    const { operation, segment, address } =
      this.memory_segments.parse_memory_access_command(command);

    const index = Number(address);
    let code = "";

    if (segment === MemorySegmentsEnum.constant) {
      // pop constant is invalid in Hack VM — constants are virtual
      throw new Error("pop constant is not a valid VM command");
    } else if (segment === MemorySegmentsEnum.static) {
      // pop static i → RAM[16 + i] = pop()
      const staticAddr = STATIC_BASE + index;
      code += `@SP\n`;
      code += `AM=M-1\n`; // SP-- and go there
      code += `D=M\n`; // read top of stack
      code += `@${staticAddr}\n`;
      code += `M=D\n`; // store into static address
    } else if (segment === MemorySegmentsEnum.temp) {
      // pop temp i → RAM[5 + i] = pop()
      const tempAddr = TEMP_BASE + index;
      code += `@SP\n`;
      code += `AM=M-1\n`;
      code += `D=M\n`;
      code += `@${tempAddr}\n`;
      code += `M=D\n`;
    } else if (segment === MemorySegmentsEnum.pointer) {
      // pop pointer 0 → THIS = pop()
      // pop pointer 1 → THAT = pop()
      const pointerAddr = index === 0 ? "THIS" : "THAT";
      code += `@SP\n`;
      code += `AM=M-1\n`;
      code += `D=M\n`;
      code += `@${pointerAddr}\n`;
      code += `M=D\n`;
    } else {
      // pop local/argument/this/that i
      // addr = base + i → RAM[addr] = pop()
      // Use R13 as scratch to store the target address
      const base = SEGMENT_BASE[segment]!;
      code += `@${index}\n`;
      code += `D=A\n`;
      code += `@${base}\n`;
      code += `D=D+M\n`; // D = base + index (target address)
      code += `@R13\n`;
      code += `M=D\n`; // R13 = target address
      code += `@SP\n`;
      code += `AM=M-1\n`; // SP-- and go there
      code += `D=M\n`; // D = top of stack value
      code += `@R13\n`;
      code += `A=M\n`; // go to target address
      code += `M=D\n`; // store value
    }

    this.global_stack.pop();
    console.log("Parsed pop command:", { operation, segment, address });
    this.output.push(code);
  }

  private get_output(): string {
    this.global_stack.print();
    return this.output.join("\n");
  }
}

export default VMTranslator;

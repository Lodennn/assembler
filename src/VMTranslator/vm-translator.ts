import GlobalStack from "./global-stack.js";
import { MemorySegmentsEnum, type TInitMemorySetter } from "./types.js";
import MemorySegments from "./memory-segments.js";
import {
  ARITHMETIC_OPERATORS,
  BRANCHING_OPERATORS,
  FUNCTION_OPERATORS,
  SEGMENT_BASE,
  STATIC_BASE,
  TEMP_BASE,
} from "./constants.js";
import dummy_vmFile from "./vm-file.js";
import Reader from "../reader/index.js";

class VMTranslator {
  private vmFile: string = "";
  private global_stack: GlobalStack = GlobalStack.getInstance();
  private memory_segments: MemorySegments = MemorySegments.getInstance();
  private output: string[] = [];
  private reader: Reader = new Reader();
  private current_function: string = "";
  private call_counter: number = 0;

  constructor(vmFile: string) {
    this.vmFile = vmFile || dummy_vmFile;
    this.init_memory();
    this.translate();
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

  public translate() {
    this.vmFile.split("\n").forEach((command) => {
      const operator = command.trim().split(" ")[0] || "";
      if (this.reader.should_be_ignored(operator)) {
        // ignore
      } else {
        if (operator === "push") {
          this.push(command);
        } else if (operator === "pop") {
          this.pop(command);
        } else if (operator && ARITHMETIC_OPERATORS[operator]) {
          if (this.global_stack.is_empty()) {
            throw new Error(`Stack is empty: ${command}`);
          }
          if (operator !== "neg" && this.global_stack.get_stack_size() < 2) {
            throw new Error(
              `Not enough items on the stack to perform arithmetic operation: ${operator}`,
            );
          }
          this.arithmetic(command);
        } else if (operator && BRANCHING_OPERATORS[operator]) {
          this.branching(command);
        } else if (operator && FUNCTION_OPERATORS[operator]) {
          this.function_commands(command);
        } else {
          throw new Error(
            `Unknown operator "${operator}". ` +
              `Did you mean one of: push, pop, add, sub, neg, eq, gt, lt, and, or, not, label, goto, if-goto, function, call, return?`,
          );
        }
        // this.translate_command(command);
      }
    });
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
    this.output.push(
      `// ${init_memory_setter.label} = ${init_memory_setter.value}`,
    );
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
      const staticAddr = STATIC_BASE + index; // this should be changed to static file name + index
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
    this.output.push(`// ${operation} ${segment} ${address}`);
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
      const staticAddr = STATIC_BASE + index; // this should be changed to static file name + index
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
    this.output.push(`// ${operation} ${segment} ${address}`);
    this.output.push(code);
  }

  // ─────────────────────────────────────────────
  // Drop these inside your VMTranslator class
  // ─────────────────────────────────────────────

  private label_counter: number = 0;

  // ─────────────────────────────────────────────
  // ARITHMETIC
  // ─────────────────────────────────────────────

  private add(): string {
    let code = "";
    code += `@SP\n`;
    code += `AM=M-1\n`; // SP-- and point A to top
    code += `D=M\n`; // D = top of stack (y)
    code += `A=A-1\n`; // point to x (one below)
    code += `M=D+M\n`; // RAM[SP-1] = x + y
    return code;
  }

  private sub(): string {
    let code = "";
    code += `@SP\n`;
    code += `AM=M-1\n`; // SP-- and point A to top
    code += `D=M\n`; // D = top of stack (y)
    code += `A=A-1\n`; // point to x (one below)
    code += `M=M-D\n`; // RAM[SP-1] = x - y
    return code;
  }

  private neg(): string {
    let code = "";
    code += `@SP\n`;
    code += `A=M-1\n`; // point to top of stack (no SP change)
    code += `M=-M\n`; // negate in place
    return code;
  }

  // ─────────────────────────────────────────────
  // COMPARISON
  // ─────────────────────────────────────────────

  private eq(): string {
    const label = `END_EQ_${this.label_counter++}`;
    let code = "";
    code += `@SP\n`;
    code += `AM=M-1\n`; // SP-- and point to y
    code += `D=M\n`; // D = y
    code += `A=A-1\n`; // point to x
    code += `D=M-D\n`; // D = x - y
    code += `M=0\n`; // assume false (0)
    code += `@${label}\n`;
    code += `D;JNE\n`; // if x != y, jump to end (stay false)
    code += `@SP\n`;
    code += `A=M-1\n`; // point back to result slot
    code += `M=-1\n`; // set true (-1)
    code += `(${label})\n`;
    return code;
  }

  private gt(): string {
    const label = `END_GT_${this.label_counter++}`;
    let code = "";
    code += `@SP\n`;
    code += `AM=M-1\n`; // SP-- and point to y
    code += `D=M\n`; // D = y
    code += `A=A-1\n`; // point to x
    code += `D=M-D\n`; // D = x - y
    code += `M=0\n`; // assume false (0)
    code += `@${label}\n`;
    code += `D;JLE\n`; // if x <= y, jump to end (stay false)
    code += `@SP\n`;
    code += `A=M-1\n`; // point back to result slot
    code += `M=-1\n`; // set true (-1)
    code += `(${label})\n`;
    return code;
  }

  private lt(): string {
    const label = `END_LT_${this.label_counter++}`;
    let code = "";
    code += `@SP\n`;
    code += `AM=M-1\n`; // SP-- and point to y
    code += `D=M\n`; // D = y
    code += `A=A-1\n`; // point to x
    code += `D=M-D\n`; // D = x - y
    code += `M=0\n`; // assume false (0)
    code += `@${label}\n`;
    code += `D;JGE\n`; // if x >= y, jump to end (stay false)
    code += `@SP\n`;
    code += `A=M-1\n`; // point back to result slot
    code += `M=-1\n`; // set true (-1)
    code += `(${label})\n`;
    return code;
  }

  // ─────────────────────────────────────────────
  // LOGICAL
  // ─────────────────────────────────────────────

  private and(): string {
    let code = "";
    code += `@SP\n`;
    code += `AM=M-1\n`; // SP-- and point to y
    code += `D=M\n`; // D = y
    code += `A=A-1\n`; // point to x
    code += `M=D&M\n`; // RAM[SP-1] = x & y
    return code;
  }

  private or(): string {
    let code = "";
    code += `@SP\n`;
    code += `AM=M-1\n`; // SP-- and point to y
    code += `D=M\n`; // D = y
    code += `A=A-1\n`; // point to x
    code += `M=D|M\n`; // RAM[SP-1] = x | y
    return code;
  }

  private not(): string {
    let code = "";
    code += `@SP\n`;
    code += `A=M-1\n`; // point to top of stack (no SP change)
    code += `M=!M\n`; // bitwise NOT in place
    return code;
  }

  // ─────────────────────────────────────────────
  // DISPATCHER — call this from your translate() method
  // maps the VM command string to the right method
  // ─────────────────────────────────────────────

  private arithmetic(command: string): void {
    const _command = command.trim().split(" ");
    if (!ARITHMETIC_OPERATORS[_command[0]!] || _command.length !== 1) {
      throw new Error(`Invalid arithmetic command: ${command}`);
    }

    let code = "";

    switch (command.trim()) {
      case "add":
        code = this.add();
        this.output.push(`// add`);
        break;
      case "sub":
        code = this.sub();
        this.output.push(`// sub`);
        break;
      case "neg":
        code = this.neg();
        this.output.push(`// neg`);
        break;
      case "eq":
        code = this.eq();
        this.output.push(`// eq`);
        break;
      case "gt":
        code = this.gt();
        this.output.push(`// gt`);
        break;
      case "lt":
        code = this.lt();
        this.output.push(`// lt`);
        break;
      case "and":
        code = this.and();
        this.output.push(`// and`);
        break;
      case "or":
        code = this.or();
        this.output.push(`// or`);
        break;
      case "not":
        code = this.not();
        this.output.push(`// not`);
        break;
      default:
        throw new Error(`Unknown arithmetic/logical command: ${command}`);
    }

    this.output.push(code);
  }
  private branching(command: string): void {
    const parts = command.trim().split(" ");
    this.validate_branching(parts);
    const op = parts[0]!;

    // build the scoped label: currentFunction$labelName
    // e.g. "label LOOP" inside "countdown" → "countdown$LOOP"
    const label = `${this.current_function}$${parts[1]}`;

    let code = "";

    if (op === "label") {
      // ─────────────────────────────────────────
      // label LOOP
      // just declares a jump destination in assembly
      // no stack change, no register change
      // ─────────────────────────────────────────
      code += `(${label})\n`;
    } else if (op === "goto") {
      // ─────────────────────────────────────────
      // goto LOOP
      // unconditional jump — always goes to label
      // no stack change
      // ─────────────────────────────────────────
      code += `@${label}\n`; // load label address into A
      code += `0;JMP\n`; // jump always
    } else if (op === "if-goto") {
      // ─────────────────────────────────────────
      // if-goto LOOP
      // pops top of stack
      // if value != 0 → jump to label
      // if value == 0 → fall through to next line
      // ─────────────────────────────────────────
      code += `@SP\n`; // load SP address
      code += `AM=M-1\n`; // SP-- and point A to the top value
      code += `D=M\n`; // D = popped value (the condition)
      code += `@${label}\n`; // load label address into A
      code += `D;JNE\n`; // if D != 0 (true) → jump

      this.global_stack.pop(); // reflect the pop in our simulated stack
    }

    this.output.push(`// ${command.trim()}`);
    this.output.push(code);
  }

  private function_commands(command: string): void {
    const parts = command.trim().split(" ");
    const op = parts[0]!;

    if (op === "function") {
      // ─────────────────────────────────────────
      // function functionName nVars
      // 1. declare a label so `call` can jump here
      // 2. push nVars zeros onto the stack
      //    these become the function's local variables
      //    LCL already points here (set by the `call` that jumped to us)
      // ─────────────────────────────────────────
      this.validate_function(parts);
      const fnName = parts[1]!;
      const nVars = Number(parts[2]);

      // update current_function so branching labels get the right prefix
      this.current_function = fnName;

      let code = "";

      // declare the function entry label
      code += `(${fnName})\n`;

      // push one zero per local variable
      for (let i = 0; i < nVars; i++) {
        code += `// initialize local[${i}] = 0\n`;
        code += `@SP\n`; // load SP
        code += `A=M\n`; // go to address SP points at
        code += `M=0\n`; // write 0 into that slot
        code += `@SP\n`; // load SP again
        code += `M=M+1\n`; // SP++

        this.global_stack.push(0);
      }

      this.output.push(`// function ${fnName} ${nVars}`);
      this.output.push(code);
    } else if (op === "call") {
      // ─────────────────────────────────────────
      // call functionName nArgs
      // the caller already pushed nArgs arguments before this command
      // we now:
      //   1. push return address        (where to come back after the call)
      //   2. push LCL                   (save caller's LCL pointer)
      //   3. push ARG                   (save caller's ARG pointer)
      //   4. push THIS                  (save caller's THIS pointer)
      //   5. push THAT                  (save caller's THAT pointer)
      //   6. ARG = SP - 5 - nArgs       (point ARG at the first argument)
      //   7. LCL = SP                   (point LCL at callee's future locals)
      //   8. goto functionName          (jump to the function)
      //   9. declare return label       (this is where we come back to)
      // ─────────────────────────────────────────
      this.validate_call(parts);
      const fnName = parts[1]!;
      const nArgs = Number(parts[2]);

      // unique return label: callerName$ret.N
      // call_counter ensures two calls to the same function get different labels
      // e.g. main calls square twice → main$ret.0 and main$ret.1
      const retLabel = `${this.current_function}$ret.${this.call_counter++}`;

      let code = "";

      // ── step 1: push return address ──
      // D=A loads the label's ROM address (not its contents) into D
      code += `// push return address (${retLabel})\n`;
      code += `@${retLabel}\n`; // A = address of return label in ROM
      code += `D=A\n`; // D = that ROM address
      code += `@SP\n`; // load SP
      code += `A=M\n`; // go to top of stack
      code += `M=D\n`; // write return address onto stack
      code += `@SP\n`;
      code += `M=M+1\n`; // SP++

      // ── step 2: push LCL ──
      code += `// push saved LCL (caller's local segment pointer)\n`;
      code += `@LCL\n`; // load LCL register
      code += `D=M\n`; // D = value of LCL (the pointer itself)
      code += `@SP\n`;
      code += `A=M\n`;
      code += `M=D\n`; // write LCL onto stack
      code += `@SP\n`;
      code += `M=M+1\n`; // SP++

      // ── step 3: push ARG ──
      code += `// push saved ARG (caller's argument segment pointer)\n`;
      code += `@ARG\n`;
      code += `D=M\n`; // D = value of ARG
      code += `@SP\n`;
      code += `A=M\n`;
      code += `M=D\n`;
      code += `@SP\n`;
      code += `M=M+1\n`; // SP++

      // ── step 4: push THIS ──
      code += `// push saved THIS (caller's this segment pointer)\n`;
      code += `@THIS\n`;
      code += `D=M\n`; // D = value of THIS
      code += `@SP\n`;
      code += `A=M\n`;
      code += `M=D\n`;
      code += `@SP\n`;
      code += `M=M+1\n`; // SP++

      // ── step 5: push THAT ──
      code += `// push saved THAT (caller's that segment pointer)\n`;
      code += `@THAT\n`;
      code += `D=M\n`; // D = value of THAT
      code += `@SP\n`;
      code += `A=M\n`;
      code += `M=D\n`;
      code += `@SP\n`;
      code += `M=M+1\n`; // SP++

      // ── step 6: ARG = SP - 5 - nArgs ──
      // reposition ARG to point at the first argument the caller pushed
      // SP has advanced by 5 (the saved frame), so we subtract 5 + nArgs
      code += `// ARG = SP - 5 - ${nArgs} (point ARG at first argument)\n`;
      code += `@SP\n`;
      code += `D=M\n`; // D = current SP
      code += `@5\n`;
      code += `D=D-A\n`; // D = SP - 5
      code += `@${nArgs}\n`;
      code += `D=D-A\n`; // D = SP - 5 - nArgs
      code += `@ARG\n`;
      code += `M=D\n`; // ARG = D

      // ── step 7: LCL = SP ──
      // point LCL at the current top of stack
      // this is where the callee's local variables will be allocated
      code += `// LCL = SP (point LCL at start of callee's local segment)\n`;
      code += `@SP\n`;
      code += `D=M\n`; // D = SP
      code += `@LCL\n`;
      code += `M=D\n`; // LCL = SP

      // ── step 8: goto function ──
      code += `// jump to ${fnName}\n`;
      code += `@${fnName}\n`;
      code += `0;JMP\n`; // unconditional jump to function entry

      // ── step 9: declare return label ──
      // execution resumes here after the callee executes `return`
      code += `// return address label — execution resumes here\n`;
      code += `(${retLabel})\n`;

      this.output.push(`// call ${fnName} ${nArgs}`);
      this.output.push(code);
    } else if (op === "return") {
      // ─────────────────────────────────────────
      // return
      // 1. save endFrame = LCL into R14
      // 2. save retAddr = RAM[endFrame-5] into R15  ← MUST be before restoring LCL
      // 3. RAM[ARG] = pop()   → place return value for caller
      // 4. SP = ARG + 1       → collapse callee's stack frame
      // 5. restore THAT = RAM[endFrame-1]
      // 6. restore THIS = RAM[endFrame-2]
      // 7. restore ARG  = RAM[endFrame-3]
      // 8. restore LCL  = RAM[endFrame-4]
      // 9. goto retAddr       → jump back into caller's code
      // ─────────────────────────────────────────
      this.validate_return(parts);
      let code = "";

      // ── step 1: endFrame → R14 ──
      // R14 holds LCL's value so we can walk back through the saved frame
      code += `// step 1: R14 = endFrame = LCL\n`;
      code += `@LCL\n`;
      code += `D=M\n`; // D = LCL (address of end of saved frame)
      code += `@R14\n`;
      code += `M=D\n`; // R14 = endFrame

      // ── step 2: retAddr → R15 ──
      // retAddr lives at RAM[endFrame - 5]
      // grab it NOW before LCL is overwritten in step 8
      code += `// step 2: R15 = retAddr = RAM[endFrame - 5]\n`;
      code += `// (must grab before we restore LCL or it is lost forever)\n`;
      code += `@5\n`;
      code += `A=D-A\n`; // A = endFrame - 5
      code += `D=M\n`; // D = RAM[endFrame - 5] = return address
      code += `@R15\n`;
      code += `M=D\n`; // R15 = retAddr

      // ── step 3: RAM[ARG] = pop() ──
      // copy return value directly into ARG[0]
      // the caller will find it there after SP is repositioned
      code += `// step 3: RAM[ARG] = pop() — place return value for caller\n`;
      code += `@SP\n`;
      code += `AM=M-1\n`; // SP-- and point A to the top value
      code += `D=M\n`; // D = return value
      code += `@ARG\n`;
      code += `A=M\n`; // go to address that ARG points at
      code += `M=D\n`; // RAM[ARG] = return value

      // ── step 4: SP = ARG + 1 ──
      // ARG is a pointer (an address) — we add 1 to the address itself
      // SP lands just above the return value we placed in step 3
      code += `// step 4: SP = ARG + 1 — collapse callee's stack frame\n`;
      code += `@ARG\n`;
      code += `D=M\n`; // D = ARG (the address, not the value at ARG)
      code += `@SP\n`;
      code += `M=D+1\n`; // SP = ARG + 1

      // ── step 5: restore THAT = RAM[endFrame - 1] ──
      // AM=M-1 decrements R14 and points A there in one instruction
      code += `// step 5: restore THAT = RAM[endFrame - 1]\n`;
      code += `@R14\n`;
      code += `AM=M-1\n`; // R14-- and A = endFrame - 1
      code += `D=M\n`; // D = saved THAT
      code += `@THAT\n`;
      code += `M=D\n`; // THAT restored

      // ── step 6: restore THIS = RAM[endFrame - 2] ──
      code += `// step 6: restore THIS = RAM[endFrame - 2]\n`;
      code += `@R14\n`;
      code += `AM=M-1\n`; // R14-- and A = endFrame - 2
      code += `D=M\n`; // D = saved THIS
      code += `@THIS\n`;
      code += `M=D\n`; // THIS restored

      // ── step 7: restore ARG = RAM[endFrame - 3] ──
      code += `// step 7: restore ARG = RAM[endFrame - 3]\n`;
      code += `@R14\n`;
      code += `AM=M-1\n`; // R14-- and A = endFrame - 3
      code += `D=M\n`; // D = saved ARG
      code += `@ARG\n`;
      code += `M=D\n`; // ARG restored

      // ── step 8: restore LCL = RAM[endFrame - 4] ──
      code += `// step 8: restore LCL = RAM[endFrame - 4]\n`;
      code += `@R14\n`;
      code += `AM=M-1\n`; // R14-- and A = endFrame - 4
      code += `D=M\n`; // D = saved LCL
      code += `@LCL\n`;
      code += `M=D\n`; // LCL restored

      // ── step 9: goto retAddr ──
      // R15 holds the return address saved in step 2
      // A=M dereferences R15 to get the actual ROM address to jump to
      code += `// step 9: goto retAddr — jump back into caller's code\n`;
      code += `@R15\n`;
      code += `A=M\n`; // A = retAddr (the ROM address stored in R15)
      code += `0;JMP\n`; // jump to caller

      this.output.push(`// return`);
      this.output.push(code);
    }
  }

  private validate_function(parts: string[]): void {
    if (parts.length !== 3)
      throw new Error(
        `'function' expects 2 args: function <name> <nVars>. Got: "${parts.join(" ")}"`,
      );

    if (!parts[1] || parts[1].trim() === "")
      throw new Error(`'function' missing name`);

    const nVars = Number(parts[2]);
    if (isNaN(nVars) || nVars < 0 || !Number.isInteger(nVars))
      throw new Error(
        `'function' nVars must be a non-negative integer. Got: "${parts[2]}"`,
      );
  }
  private validate_call(parts: string[]): void {
    if (parts.length !== 3)
      throw new Error(
        `'call' expects 2 args: call <name> <nArgs>. Got: "${parts.join(" ")}"`,
      );

    if (!parts[1] || parts[1].trim() === "")
      throw new Error(`'call' missing function name`);

    const nArgs = Number(parts[2]);
    if (isNaN(nArgs) || nArgs < 0 || !Number.isInteger(nArgs))
      throw new Error(
        `'call' nArgs must be a non-negative integer. Got: "${parts[2]}"`,
      );
  }
  private validate_return(parts: string[]): void {
    if (parts.length !== 1)
      throw new Error(`'return' takes no arguments. Got: "${parts.join(" ")}"`);

    if (!this.current_function)
      throw new Error(`'return' found outside a function`);
  }
  private validate_branching(parts: string[]): void {
    const op = parts[0]!;

    if (parts.length !== 2)
      throw new Error(
        `'${op}' expects exactly 1 argument: ${op} <label>. Got: "${parts.join(" ")}"`,
      );

    if (!parts[1] || parts[1].trim() === "")
      throw new Error(`'${op}' missing label name`);

    if (!this.current_function)
      throw new Error(
        `'${op}' found outside a function — branching commands must be inside a function body`,
      );
  }

  public getOutput(): string {
    return this.output.join("\n");
  }

  public static translateVM(vmFile: string): string {
    const translator = new VMTranslator(vmFile);
    return translator.getOutput();
  }
}

export default VMTranslator;

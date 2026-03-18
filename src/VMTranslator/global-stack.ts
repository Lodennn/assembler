import MemorySegments from "./memory-segments.js";

class GlobalStack {
  // The actual stack starts at RAM[256]
  // We simulate it as an array where index 0 = RAM[256]
  private stack: number[] = [];

  private memory_segments: MemorySegments = MemorySegments.getInstance();

  private static instance: GlobalStack;

  private constructor() {}

  public static getInstance(): GlobalStack {
    if (!GlobalStack.instance) {
      GlobalStack.instance = new GlobalStack();
    }
    return GlobalStack.instance;
  }

  public push(value: number) {
    this.stack.push(value);
  }

  public pop(): number {
    if (this.stack.length === 0) {
      throw new Error("Stack underflow");
    }
    return this.stack.pop()!;
  }

  public get_stack_size(): number {
    return this.stack.length;
  }

  public is_empty(): boolean {
    return this.stack.length === 0;
  }

  public print() {
    const stackCopy = [...this.stack].reverse();
    // SP always points to the NEXT free slot, so SP = 256 + stack.length
    const sp = 256 + this.stack.length;

    console.log("\n--- STACK VIEW ---");
    console.log(` SP → RAM[${sp}] (next free slot)`);
    console.log(" ┌─────────┐");

    if (stackCopy.length === 0) {
      console.log(" │ (empty) │");
    } else {
      stackCopy.forEach((val, index) => {
        // Top of stack is at RAM[256 + stack.length - 1]
        const addr = 256 + (stackCopy.length - 1 - index);
        const displayVal = val.toString().padStart(7, " ");
        const isTop = index === 0;
        console.log(` │ ${displayVal} │  RAM[${addr}]${isTop ? " ← top" : ""}`);
        if (index < stackCopy.length - 1) {
          console.log(" ├─────────┤");
        }
      });
    }

    console.log(" └─────────┘");
    console.log("------------------\n");
  }
}

export default GlobalStack;

import type { IVMWriter } from "./vm-writet.interface";

class VMWriter implements IVMWriter {
  private static instance: VMWriter;
  private output: string = "";

  private constructor() {}

  static getInstance(): VMWriter {
    if (!VMWriter.instance) {
      VMWriter.instance = new VMWriter();
    }
    return VMWriter.instance;
  }

  /** Full VM program accumulated so far (Jack → VM translation output). */
  getOutput(): string {
    return this.output;
  }

  /** Clear buffer — call before a new compilation when reusing the singleton. */
  reset(): void {
    this.output = "";
  }

  private emit(line: string): void {
    this.output += `${line}\n`;
  }

  writePush(segment: string, index: number): void {
    this.emit(`push ${segment} ${index}`);
  }

  writePop(segment: string, index: number): void {
    this.emit(`pop ${segment} ${index}`);
  }

  writeArithmetic(command: string): void {
    this.emit(command);
  }

  writeLabel(label: string): void {
    this.emit(`label ${label}`);
  }

  writeGoto(label: string): void {
    this.emit(`goto ${label}`);
  }

  writeIf(label: string): void {
    this.emit(`if-goto ${label}`);
  }

  writeCall(name: string, nArgs: number): void {
    this.emit(`call ${name} ${nArgs}`);
  }

  writeFunction(name: string, nLocals: number): void {
    this.emit(`function ${name} ${nLocals}`);
  }

  writeReturn(): void {
    this.emit("return");
  }
}

export default VMWriter;

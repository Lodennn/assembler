export interface IVMWriter {
  writePush(segment: string, index: number): void;
  writePop(segment: string, index: number): void;
  writeArithmetic(command: string): void;
  writeLabel(label: string): void;
  writeGoto(label: string): void;
  writeIf(label: string): void;
  writeCall(name: string, nArgs: number): void;
  writeFunction(name: string, nLocals: number): void;
  writeReturn(): void;
}

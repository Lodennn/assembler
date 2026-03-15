import ISA from "./ISA.js";
type DestKeys = keyof typeof ISA.C_INSTRUCTION.dest;
type CompKeys = keyof typeof ISA.C_INSTRUCTION.comp;
type JumpKeys = keyof typeof ISA.C_INSTRUCTION.jump;
type Operation = "A" | "C";
export type { DestKeys, CompKeys, JumpKeys, Operation };
//# sourceMappingURL=types.d.ts.map
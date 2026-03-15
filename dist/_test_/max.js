export default `
// Computes R2 = max(R0, R1)
@R0
D=M              // D = first number
@R1
D=D-M            // D = first number - second number
@OUTPUT_FIRST
D;JGT            // if D > 0 (first is greater) goto OUTPUT_FIRST
@R1
D=M              // D = second number
@OUTPUT_D
0;JMP            // goto OUTPUT_D
(OUTPUT_FIRST)
@R0
D=M              // D = first number
(OUTPUT_D)
@R2
M=D              // R2 = max(R0, R1)
(END)
@END
0;JMP            // infinite loop`;
//# sourceMappingURL=max.js.map
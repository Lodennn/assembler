export default `// Multiplies R0 and R1 and stores the result in R2.
// (R0, R1, R2 refer to RAM[0], RAM[1], and RAM[2], respectively.)

@R2
M=0          // Initialize R2 to 0

@R0
D=M
@END
D;JEQ        // If R0 == 0, jump to END

@R1
D=M
@END
D;JEQ        // If R1 == 0, jump to END

(LOOP)
@R0
D=M          // Get R0
@R2
M=D+M        // R2 = R2 + R0

@R1
M=M-1        // R1 = R1 - 1
D=M          // Check remaining iterations

@LOOP
D;JGT        // If R1 > 0, repeat the loop

(END)
@END
0;JMP        // Infinite loop`;
//# sourceMappingURL=multi.js.map
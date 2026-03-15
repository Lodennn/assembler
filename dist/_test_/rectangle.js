export default `// Draws a rectangle at the top-left of the screen.
// The height is R0, width is 16 pixels.
@R0
D=M
@END
D;JLE    // If R0 <= 0, exit

@counter
M=D      // counter = R0
@SCREEN
D=A
@address
M=D      // address = 16384 (base address of screen)

(LOOP)
@address
A=M
M=-1     // RAM[address] = -1 (16 black pixels)

@address
D=M
@32
D=D+A
@address
M=D      // address = address + 32 (next row)

@counter
M=M-1
D=M
@LOOP
D;JGT    // if counter > 0, repeat

(END)
@END
0;JMP`;
//# sourceMappingURL=rectangle.js.map
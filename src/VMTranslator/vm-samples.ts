/**
 * Demo VM programs matching the spirit of the assembler demos:
 * Add, Max, Multiplication, Rectangle.
 * Each program is a complete `function` so branching is valid.
 */

export type VMSampleId = "sum" | "max" | "multi" | "rectangle";

export const VM_SAMPLES: Record<VMSampleId, string> = {
  sum: `
function main 0
// RAM[16] = 2 + 3 (static 0 in a single-file VM maps to one static slot)
push constant 2
push constant 3
add
pop static 0
label END
goto END
`.trim(),

  max: `
function main 0
// static 0,1 = two values; static 2 = max
push constant 7
pop static 0
push constant 3
pop static 1
push static 0
push static 1
gt
if-goto USE_FIRST
push static 1
goto DONE
label USE_FIRST
push static 0
label DONE
pop static 2
label END
goto END
`.trim(),

  multi: `
function main 0
// static 0 = R0, static 1 = R1, static 2 = product (R0 * R1)
push constant 3
pop static 0
push constant 4
pop static 1
push constant 0
pop static 2
label LOOP
push static 1
push constant 0
eq
if-goto END_LOOP
push static 2
push static 0
add
pop static 2
push static 1
push constant 1
sub
pop static 1
goto LOOP
label END_LOOP
label END
goto END
`.trim(),

  rectangle: `
function main 0
// Height in static 0; draw height rows (16 px wide) at top-left of screen
push constant 5
pop static 0
push constant 16384
pop pointer 0
label ROW_LOOP
push static 0
push constant 0
eq
if-goto END_ROWS
push constant 0
not
pop this 0
push pointer 0
push constant 32
add
pop pointer 0
push static 0
push constant 1
sub
pop static 0
goto ROW_LOOP
label END_ROWS
label END
goto END
`.trim(),
};

/** Inner width of the ASCII box (characters between side borders). */
const STACK_BOX_INNER = 32;

class TokenizerStackReader {
  private stack: string[] = [];
  constructor() {}
  push(token: string): void {
    this.stack.push(token);
  }
  pop(): string | undefined {
    return this.stack.pop();
  }
  peek(): string | undefined {
    return this.stack[this.stack.length - 1];
  }
  empty(): boolean {
    return this.stack.length === 0;
  }

  /**
   * Pretty-print the stack in the console (top of stack at top of the box).
   */
  public print(): void {
    const w = STACK_BOX_INNER;
    const rule = ` ┌${"─".repeat(w)}┐`;
    const sep = ` ├${"─".repeat(w)}┤`;

    console.log("\n ╔══════════════════════════════════╗");
    console.log(" ║       TOKENIZER — token stack    ║");
    console.log(" ╚══════════════════════════════════╝");
    // console.log(`  depth: ${this.stack.length}   peek: ${this.peek() ?? "—"}`);
    console.log(rule);

    if (this.stack.length === 0) {
      const msg = "(empty)";
      const padL = Math.max(0, Math.floor((w - msg.length) / 2));
      const padR = Math.max(0, w - padL - msg.length);
      console.log(` │${" ".repeat(padL)}${msg}${" ".repeat(padR)}│`);
    } else {
      const reversed = [...this.stack].reverse();
      reversed.forEach((token, i) => {
        const row = this.formatRow(i, token, w);
        console.log(` │${row}│`);
        if (i < reversed.length - 1) console.log(sep);
      });
    }

    console.log(` └${"─".repeat(w)}┘\n`);
  }

  private formatRow(
    indexFromTop: number,
    token: string,
    innerWidth: number,
  ): string {
    const tag = indexFromTop === 0 ? "TOP" : `+${indexFromTop}`;
    const raw = this.formatTokenForDisplay(token, innerWidth - tag.length - 1);
    const row = `${tag} ${raw}`;
    return row.length > innerWidth
      ? row.slice(0, innerWidth)
      : row.padEnd(innerWidth);
  }

  /** Truncate long tokens so the box stays readable in the console. */
  private formatTokenForDisplay(token: string, maxLen: number): string {
    const t = token.replace(/\s+/g, " ").trim();
    if (t.length <= maxLen) return t;
    return `${t.slice(0, Math.max(0, maxLen - 1))}…`;
  }
}

export default TokenizerStackReader;

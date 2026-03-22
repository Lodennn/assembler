import type { ITokenizer } from "./tokenizer.interface.js";
import { IGNORES, KEYWORDS, SYMBOLS } from "./constants.js";
import { TokenType } from "./types.js";
import TokenizerStackReader from "./TokenizerStackReader.js";
import CommentReader from "./comment.js";
class Tokenizer implements ITokenizer {
  /** Newline-delimited cleaned source (comments stripped). */
  private cleanHighLevelLanguageFile: string = "";
  private tokenizerStackReader = new TokenizerStackReader();
  private tokenizerOutput: string[] = [];
  private output: string = "";
  constructor(highLevelLanguageFile: string) {
    // read the high level language file
    this.clean(highLevelLanguageFile);
    const output = this.tokenizeHighLevelLanguageFile(
      this.cleanHighLevelLanguageFile,
    );
    this.output = output;
    console.log("=== OUTPUT ===");
    console.log(this.output);
  }

  private clean(highLevelLanguageFile: string): void {
    const cleanLines: string[] = [];
    const lines = highLevelLanguageFile.split("\n").map((line) => line.trim());
    const commentReader = new CommentReader(this.tokenizerStackReader);
    let currentLine = "";
    for (let i = 0; i < lines.length; i++) {
      if (this.is_empty(lines[i]!)) {
        continue;
      }
      for (let j = 0; j < lines[i]!.length; j++) {
        if (!lines[i]![j]!) continue;

        if (commentReader.is_inline_comment(lines[i]![j]!, lines[i]![j + 1]!)) {
          commentReader.push_comment("inline", "open");
        } else if (
          this.tokenizerStackReader.peek() == "//" &&
          // prettier-ignore
          commentReader.is_inline_comment_close(lines[i]![j]!,lines[i]![j + 1]!)
        ) {
          this.tokenizerStackReader.pop();
          continue;
        } else if (
          // prettier-ignore
          commentReader.is_api_comment(lines[i]![j]!, lines[i]![j + 1]!, lines[i]![j + 2]!)
        ) {
          commentReader.push_comment("api", "open");
        } else if (
          commentReader.is_api_comment_close(lines[i]![j]!, lines[i]![j + 1]!)
        ) {
          this.tokenizerStackReader.pop();
          j++;
        } else if (
          commentReader.is_block_comment(lines[i]![j]!, lines[i]![j + 1]!)
        ) {
          commentReader.push_comment("block", "open");
        } else if (
          // prettier-ignore
          commentReader.is_block_comment_close(lines[i]![j]!, lines[i]![j + 1]!)
        ) {
          this.tokenizerStackReader.pop();
          j++;
        }

        const ch = lines[i]![j];
        if (
          ch !== undefined &&
          this.tokenizerStackReader.empty() &&
          !IGNORES.includes(ch)
        ) {
          currentLine += ch;
        }
      }
      if (currentLine) {
        cleanLines.push(currentLine);
      }

      currentLine = "";
    }
    this.cleanHighLevelLanguageFile = cleanLines.join("\n");

    console.log("=== CLEAN SOURCE ===");
    console.log(this.cleanHighLevelLanguageFile);

    this.tokenizerStackReader.empty();
  }

  private tokenizeHighLevelLanguageFile(
    cleanHighLevelLanguageFile: string,
  ): string {
    const tokens = cleanHighLevelLanguageFile.split("\n").map((line) => {
      return line.split(" ");
    });

    // console.log("TOKENS: ", tokens);
    tokens.forEach((token) => {
      // console.log("TOKEN: ", token);
      token.forEach((t) => {
        // console.log("T: ", t);
        let current_token: string = "";
        for (let i = 0; i < t.length; i++) {
          const current_char = t[i]!;
          // console.log("current_char: ", current_char);
          current_token += current_char;
          if (this.is_empty(current_char) || this.is_empty(current_token)) {
            continue;
          }
          // console.log("CURRENT TOKEN: ", current_token);
          if (this.is_symbol(current_char)) {
            // `10)` → integer then `)`; `main(` → identifier then `(`
            if (this.is_number(t[i - 1]!)) {
              this.pushTagged(current_token.slice(0, -1));
              this.pushTagged(current_char);
            } else {
              const prefix = current_token.slice(0, -1);
              if (prefix.length > 0) {
                this.pushTagged(prefix);
              }
              this.pushTagged(current_char);
            }
            current_token = "";
            continue;
          } else if (current_char === `"`) {
            if (this.tokenizerStackReader.peek() === `"`) {
              this.tokenizerStackReader.pop();
              this.pushTagged(current_token);
              current_token = "";
              continue;
            } else {
              this.tokenizerStackReader.push(current_char);
            }
          }
        }
        if (current_token) {
          this.pushTagged(current_token);
          current_token = "";
        }
        // console.log("CURRENT TOKEN: ", current_token);
      });
    });
    console.log("=== TOKENIZED OUTPUT ===");
    console.log(this.tokenizerOutput);
    return `<tokens>\n${this.tokenizerOutput.join("\n")}\n</tokens>`;
  }

  private is_empty(char: string): boolean {
    return char === "";
  }

  advance(): void {
    throw new Error("Method not implemented.");
  }
  hasMoreTokens(): boolean {
    throw new Error("Method not implemented.");
  }
  tokenType(): TokenType {
    throw new Error("Method not implemented.");
  }
  keyWord(): string {
    throw new Error("Method not implemented.");
  }
  symbol(): string {
    throw new Error("Method not implemented.");
  }
  identifier(): string {
    throw new Error("Method not implemented.");
  }
  intVal(): string {
    throw new Error("Method not implemented.");
  }
  stringVal(): string {
    throw new Error("Method not implemented.");
  }

  private is_keyword(token: string): boolean {
    return KEYWORDS.includes(token);
  }
  private is_identifier(token: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token);
  }
  private is_number(token: string): boolean {
    return /^[0-9]+$/.test(token);
  }
  private is_string(token: string): boolean {
    return /^"[^"]*"$/.test(token);
  }
  private is_symbol(token: string): boolean {
    return SYMBOLS.includes(token);
  }
  private is_space(token: string): boolean {
    return token === " ";
  }

  private tokenize(token: string): string {
    if (this.is_keyword(token)) {
      return `<${TokenType.KEYWORD.toLowerCase()}>${token}</${TokenType.KEYWORD.toLowerCase()}>`;
    } else if (this.is_symbol(token)) {
      return `<${TokenType.SYMBOL.toLowerCase()}>${token}</${TokenType.SYMBOL.toLowerCase()}>`;
    } else if (this.is_identifier(token)) {
      return `<${TokenType.IDENTIFIER.toLowerCase()}>${token}</${TokenType.IDENTIFIER.toLowerCase()}>`;
    } else if (this.is_number(token)) {
      const tokenType = "integerConstant";
      return `<${tokenType}>${token}</${tokenType}>`;
    } else if (this.is_string(token)) {
      const stringValue = token.slice(1, -1);
      const tokenType = "stringConstant";
      return `<${tokenType}>${stringValue}</${tokenType}>`;
    }
    return "";
  }

  /** Only pushes when `tokenize` classifies the string (avoids `""` in output). */
  private pushTagged(raw: string): void {
    const tagged = this.tokenize(raw);
    if (tagged !== "") {
      this.tokenizerOutput.push(tagged);
    }
  }
}

export default Tokenizer;

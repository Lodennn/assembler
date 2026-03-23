import type { ITokenizer } from "./tokenizer.interface.js";
import { IGNORES, KEYWORDS, SYMBOLS } from "./constants.js";
import { TokenType, type TokenRecord } from "./types.js";
import TokenizerStackReader from "./TokenizerStackReader.js";
import CommentReader from "./comment.js";

class Tokenizer implements ITokenizer {
  /** Newline-delimited cleaned source (comments stripped). */
  private cleanHighLevelLanguageFile: string = "";
  private tokenizerStackReader = new TokenizerStackReader();
  /** Course-style token stream (cursor over this). */
  private tokenRecords: TokenRecord[] = [];
  /** Cursor: index of the *current* token (0 .. length-1). */
  private currentIndex = 0;
  private tokenizerOutput: string[] = [];
  private static instance: Tokenizer;

  private constructor(highLevelLanguageFile: string) {
    this.clean(highLevelLanguageFile);
    this.tokenizeHighLevelLanguageFile(this.cleanHighLevelLanguageFile);
    console.log("===HIGH LEVEL LANGUAGE FILE===");
    console.log(highLevelLanguageFile);
    console.log("===CLEAN HIGH LEVEL LANGUAGE FILE===");
    console.log(this.cleanHighLevelLanguageFile);
    console.log("===TOKENIZER OUTPUT===");
    console.log(this.tokenizerOutput.join("\n"));
  }
  static getInstance(highLevelLanguageFile: string): Tokenizer {
    // Re-tokenize every time so UI can analyze arbitrary code on demand.
    Tokenizer.instance = new Tokenizer(highLevelLanguageFile);
    return Tokenizer.instance;
  }

  /** `<tokens>...</tokens>` XML (one line per token element). */
  public getTokensOutput(): string {
    return this.tokenizerOutput.join("\n");
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

    this.tokenizerStackReader.empty();
  }

  private tokenizeHighLevelLanguageFile(
    cleanHighLevelLanguageFile: string,
  ): void {
    this.tokenRecords = [];
    this.tokenizerOutput = [];
    this.currentIndex = 0;

    this.tokenizerOutput.push("<tokens>");

    const linesWords = cleanHighLevelLanguageFile.split("\n").map((line) => {
      return line.split(" ");
    });

    linesWords.forEach((lineWords) => {
      lineWords.forEach((t) => {
        let current_token: string = "";
        for (let i = 0; i < t.length; i++) {
          const current_char = t[i]!;
          current_token += current_char;
          if (this.is_empty(current_char) || this.is_empty(current_token)) {
            continue;
          }
          if (this.is_symbol(current_char)) {
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
      });
    });
    this.tokenizerOutput.push("</tokens>");
  }

  private is_empty(char: string): boolean {
    return char === "";
  }

  hasMoreTokens(): boolean {
    return this.currentIndex < this.tokenRecords.length;
  }

  advance(): void {
    if (this.hasMoreTokens()) {
      this.currentIndex++;
    }
  }

  tokenType(): TokenType {
    return this.getCurrentRecord().type;
  }

  keyWord(): string {
    const r = this.getCurrentRecord();
    if (r.type !== TokenType.KEYWORD) {
      throw new Error("keyWord() called when current token is not a KEYWORD");
    }
    return r.lexeme;
  }

  symbol(): string {
    const r = this.getCurrentRecord();
    if (r.type !== TokenType.SYMBOL) {
      throw new Error("symbol() called when current token is not a SYMBOL");
    }
    return r.lexeme;
  }

  identifier(): string {
    const r = this.getCurrentRecord();
    if (r.type !== TokenType.IDENTIFIER) {
      throw new Error(
        "identifier() called when current token is not an IDENTIFIER",
      );
    }
    return r.lexeme;
  }

  intVal(): string {
    const r = this.getCurrentRecord();
    if (r.type !== TokenType.INTEGER_CONST) {
      throw new Error(
        "intVal() called when current token is not an INTEGER_CONST",
      );
    }
    return r.lexeme;
  }

  stringVal(): string {
    const r = this.getCurrentRecord();
    if (r.type !== TokenType.STRING_CONST) {
      throw new Error(
        "stringVal() called when current token is not a STRING_CONST",
      );
    }
    return r.lexeme;
  }

  public getCurrentRecord(): TokenRecord {
    if (this.currentIndex >= this.tokenRecords.length) {
      throw new Error("No current token (end of stream or past advance)");
    }
    return this.tokenRecords[this.currentIndex]!;
  }

  /**
   * Reset tokenizer cursor so the parser can run again on the same token stream.
   * Useful when re-clicking "Parse" without re-running "Analyze".
   */
  public resetCursor(): void {
    this.currentIndex = 0;
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

  /** Escape XML metacharacters in symbol text (e.g. `<`, `>` as operators). */
  private escapeXmlSymbol(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  private classifyLexeme(raw: string): TokenRecord | null {
    if (this.is_keyword(raw)) {
      return { type: TokenType.KEYWORD, lexeme: raw };
    }
    if (this.is_symbol(raw)) {
      return { type: TokenType.SYMBOL, lexeme: raw };
    }
    if (this.is_identifier(raw)) {
      return { type: TokenType.IDENTIFIER, lexeme: raw };
    }
    if (this.is_number(raw)) {
      return { type: TokenType.INTEGER_CONST, lexeme: raw };
    }
    if (this.is_string(raw)) {
      return {
        type: TokenType.STRING_CONST,
        lexeme: raw.slice(1, -1),
      };
    }
    return null;
  }

  private tokenizeRecord(rec: TokenRecord): string {
    switch (rec.type) {
      case TokenType.KEYWORD:
        return `<${TokenType.KEYWORD.toLowerCase()}>${rec.lexeme}</${TokenType.KEYWORD.toLowerCase()}>`;
      case TokenType.SYMBOL: {
        const body = this.escapeXmlSymbol(rec.lexeme);
        return `<${TokenType.SYMBOL.toLowerCase()}>${body}</${TokenType.SYMBOL.toLowerCase()}>`;
      }
      case TokenType.IDENTIFIER:
        return `<${TokenType.IDENTIFIER.toLowerCase()}>${rec.lexeme}</${TokenType.IDENTIFIER.toLowerCase()}>`;
      case TokenType.INTEGER_CONST:
        return `<integerConstant>${rec.lexeme}</integerConstant>`;
      case TokenType.STRING_CONST:
        return `<stringConstant>${rec.lexeme}</stringConstant>`;
      default: {
        const _exhaustive: never = rec.type;
        return _exhaustive;
      }
    }
  }

  /** Classify, append to course token stream and XML line list. */
  private pushTagged(raw: string): void {
    const rec = this.classifyLexeme(raw);
    if (!rec) return;
    this.tokenRecords.push(rec);
    this.tokenizerOutput.push(this.tokenizeRecord(rec));
  }
}

export default Tokenizer;

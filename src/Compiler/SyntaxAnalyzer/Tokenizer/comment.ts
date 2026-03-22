import type TokenizerStackReader from "./TokenizerStackReader";

type commentType = "inline" | "api" | "block";
type commentDirection = "open" | "close";

class CommentReader {
  private tokenizerStackReader: TokenizerStackReader;

  constructor(tokenizerStackReader: TokenizerStackReader) {
    this.tokenizerStackReader = tokenizerStackReader;
  }

  public is_comment(char: string): boolean {
    return char == "/";
  }

  public is_inline_comment(currentChar: string, nextChar: string): boolean {
    return currentChar == "/" && nextChar == "/";
  }

  /** Inline `//` comments end at end-of-line (no next char on this line, or explicit newline). */
  public is_inline_comment_close(
    currentChar: string,
    nextChar: string | undefined,
  ): boolean {
    return (
      nextChar === undefined || currentChar === "\n" || currentChar === "\r"
    );
  }

  public is_api_comment(
    currentChar: string,
    nextChar: string,
    nextNextChar: string,
  ): boolean {
    const comment = currentChar + nextChar + nextNextChar;
    return comment == "/**";
  }
  public is_api_comment_close(currentChar: string, nextChar: string): boolean {
    const comment = currentChar + nextChar;
    return comment == "*/";
  }

  public is_block_comment(currentChar: string, nextChar: string): boolean {
    return currentChar == "/" && nextChar == "*";
  }
  public is_block_comment_close(
    currentChar: string,
    nextChar: string,
  ): boolean {
    const comment = currentChar + nextChar;
    return comment == "*/";
  }

  public push_comment(
    comment_type: commentType,
    comment_direction: commentDirection,
  ): void {
    const comment_symbol =
      comment_type == "inline" ? "//" : comment_type == "api" ? "/**" : "/*";
    if (comment_direction == "open") {
      this.tokenizerStackReader.push(comment_symbol);
    } else {
      this.tokenizerStackReader.pop();
    }
  }
}

export default CommentReader;

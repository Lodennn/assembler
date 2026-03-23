import type Tokenizer from "../Tokenizer/tokenizer.js";

class Parser {
  private tokenizer: Tokenizer;
  private static instance: Parser;

  private constructor(tokenizer: Tokenizer) {
    this.tokenizer = tokenizer;
    this.parse();
  }

  static getInstance(tokenizer: Tokenizer): Parser {
    if (!Parser.instance) Parser.instance = new Parser(tokenizer);
    return Parser.instance;
  }

  private parse(): void {
    for (let i = 0; i < 10; i++) {
      const currentRecord = this.tokenizer.getCurrentRecord();
      console.log("currentRecord", currentRecord);
      this.tokenizer.advance();
    }
  }
}

export default Parser;

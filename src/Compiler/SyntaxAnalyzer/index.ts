import Parser from "./Parser/parser.js";
import Tokenizer from "./Tokenizer/tokenizer.js";

class SyntaxAnalyzer {
  private static instance: SyntaxAnalyzer;
  private tokenizer: Tokenizer;
  private parser: Parser;

  private constructor(highLevelLanguageFile: string) {
    this.tokenizer = Tokenizer.getInstance(highLevelLanguageFile);
    this.parser = Parser.getInstance(this.tokenizer);
  }

  static getInstance(highLevelLanguageFile: string): SyntaxAnalyzer {
    if (!SyntaxAnalyzer.instance)
      SyntaxAnalyzer.instance = new SyntaxAnalyzer(highLevelLanguageFile);
    return SyntaxAnalyzer.instance;
  }
}

export default SyntaxAnalyzer;

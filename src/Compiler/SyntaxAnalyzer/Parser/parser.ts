import type Tokenizer from "../Tokenizer/tokenizer.js";
import { TokenType, type TokenRecord } from "../Tokenizer/types.js";
import type { IParser } from "./parser.interface.js";

class Parser implements IParser {
  private tokenizer: Tokenizer;
  private static instance: Parser;
  private output: string = "";

  private constructor(tokenizer: Tokenizer) {
    this.tokenizer = tokenizer;
    this.parse();
  }

  static getInstance(tokenizer: Tokenizer): Parser {
    // Re-parse every time so UI can parse arbitrary code on demand.
    Parser.instance = new Parser(tokenizer);
    return Parser.instance;
  }

  private parse(): void {
    this.compileClass();
  }

  private compileType(): void {
    if (
      this.tokenizer.getCurrentRecord().type === TokenType.KEYWORD &&
      (this.tokenizer.getCurrentRecord().lexeme === "int" ||
        this.tokenizer.getCurrentRecord().lexeme === "char" ||
        this.tokenizer.getCurrentRecord().lexeme === "boolean")
    ) {
      this.eat(this.tokenizer.getCurrentRecord().lexeme);
    } else {
      this.eatType(TokenType.IDENTIFIER);
    }
  }

  compileClass(): void {
    this.writeOpenTag("class");

    this.eat("class");
    this.eatType(TokenType.IDENTIFIER); // className
    this.eat("{");

    while (
      this.tokenizer.getCurrentRecord().type === TokenType.KEYWORD &&
      (this.tokenizer.getCurrentRecord().lexeme === "static" ||
        this.tokenizer.getCurrentRecord().lexeme === "field")
    ) {
      this.compileClassVarDec();
    }

    while (
      this.tokenizer.getCurrentRecord().type === TokenType.KEYWORD &&
      (this.tokenizer.getCurrentRecord().lexeme === "constructor" ||
        this.tokenizer.getCurrentRecord().lexeme === "function" ||
        this.tokenizer.getCurrentRecord().lexeme === "method")
    ) {
      this.compileSubroutine();
    }

    this.eat("}");

    this.writeCloseTag("class");
  }

  compileClassVarDec(): void {
    this.writeOpenTag("classVarDec");

    // 'static' | 'field'
    this.eat(this.tokenizer.getCurrentRecord().lexeme);

    // type
    this.compileType();

    // varName
    this.eatType(TokenType.IDENTIFIER);

    // (',' varName)*
    while (
      this.tokenizer.getCurrentRecord().type === TokenType.SYMBOL &&
      this.tokenizer.getCurrentRecord().lexeme === ","
    ) {
      this.eat(",");
      this.eatType(TokenType.IDENTIFIER);
    }

    this.eat(";");

    this.writeCloseTag("classVarDec");
  }

  compileSubroutine(): void {
    this.writeOpenTag("subroutineDec");

    // 'constructor' | 'function' | 'method'
    this.eat(this.tokenizer.getCurrentRecord().lexeme);

    // 'void' | type
    if (this.tokenizer.getCurrentRecord().lexeme === "void") {
      this.eat("void");
    } else {
      this.compileType();
    }

    // subroutineName
    this.eatType(TokenType.IDENTIFIER);

    this.eat("(");
    this.compileParameterList();
    this.eat(")");

    this.compileSubroutineBody();

    this.writeCloseTag("subroutineDec");
  }

  compileParameterList(): void {
    this.writeOpenTag("parameterList");

    // parameterList can be empty — check if next is ")"
    if (this.tokenizer.getCurrentRecord().lexeme !== ")") {
      // first parameter
      this.compileType();
      this.eatType(TokenType.IDENTIFIER);

      // (',' type varName)*
      while (
        this.tokenizer.getCurrentRecord().type === TokenType.SYMBOL &&
        this.tokenizer.getCurrentRecord().lexeme === ","
      ) {
        this.eat(",");
        this.compileType();
        this.eatType(TokenType.IDENTIFIER);
      }
    }

    this.writeCloseTag("parameterList");
  }

  compileSubroutineBody(): void {
    this.writeOpenTag("subroutineBody");

    this.eat("{");

    // varDec*
    while (
      this.tokenizer.getCurrentRecord().type === TokenType.KEYWORD &&
      this.tokenizer.getCurrentRecord().lexeme === "var"
    ) {
      this.compileVarDec();
    }

    // statements
    this.compileStatements();

    this.eat("}");

    this.writeCloseTag("subroutineBody");
  }

  compileVarDec(): void {
    this.writeOpenTag("varDec");

    this.eat("var");
    this.compileType();
    this.eatType(TokenType.IDENTIFIER);

    while (
      this.tokenizer.getCurrentRecord().type === TokenType.SYMBOL &&
      this.tokenizer.getCurrentRecord().lexeme === ","
    ) {
      this.eat(",");
      this.eatType(TokenType.IDENTIFIER);
    }

    this.eat(";");

    this.writeCloseTag("varDec");
  }

  compileStatements(): void {
    this.writeOpenTag("statements");

    while (
      this.tokenizer.getCurrentRecord().type === TokenType.KEYWORD &&
      (this.tokenizer.getCurrentRecord().lexeme === "let" ||
        this.tokenizer.getCurrentRecord().lexeme === "if" ||
        this.tokenizer.getCurrentRecord().lexeme === "while" ||
        this.tokenizer.getCurrentRecord().lexeme === "do" ||
        this.tokenizer.getCurrentRecord().lexeme === "return")
    ) {
      switch (this.tokenizer.getCurrentRecord().lexeme) {
        case "let":
          this.compileLet();
          break;
        case "if":
          this.compileIf();
          break;
        case "while":
          this.compileWhile();
          break;
        case "do":
          this.compileDo();
          break;
        case "return":
          this.compileReturn();
          break;
      }
    }

    this.writeCloseTag("statements");
  }

  compileLet(): void {
    this.writeOpenTag("letStatement");

    this.eat("let");
    this.eatType(TokenType.IDENTIFIER); // varName

    // ('[' expression ']')?
    if (
      this.tokenizer.getCurrentRecord().type === TokenType.SYMBOL &&
      this.tokenizer.getCurrentRecord().lexeme === "["
    ) {
      this.eat("[");
      this.compileExpression();
      this.eat("]");
    }

    this.eat("=");
    this.compileExpression();
    this.eat(";");

    this.writeCloseTag("letStatement");
  }

  compileIf(): void {
    this.writeOpenTag("ifStatement");

    this.eat("if");
    this.eat("(");
    this.compileExpression();
    this.eat(")");
    this.eat("{");
    this.compileStatements();
    this.eat("}");

    // ('else' '{' statements '}')?
    if (
      this.tokenizer.getCurrentRecord().type === TokenType.KEYWORD &&
      this.tokenizer.getCurrentRecord().lexeme === "else"
    ) {
      this.eat("else");
      this.eat("{");
      this.compileStatements();
      this.eat("}");
    }

    this.writeCloseTag("ifStatement");
  }

  compileWhile(): void {
    this.writeOpenTag("whileStatement");

    this.eat("while");
    this.eat("(");
    this.compileExpression();
    this.eat(")");
    this.eat("{");
    this.compileStatements();
    this.eat("}");

    this.writeCloseTag("whileStatement");
  }

  compileDo(): void {
    this.writeOpenTag("doStatement");

    this.eat("do");

    // subroutineCall
    // subroutineName '(' expressionList ')'
    // (className | varName) '.' subroutineName '(' expressionList ')'
    this.eatType(TokenType.IDENTIFIER);

    if (
      this.tokenizer.getCurrentRecord().type === TokenType.SYMBOL &&
      this.tokenizer.getCurrentRecord().lexeme === "."
    ) {
      this.eat(".");
      this.eatType(TokenType.IDENTIFIER); // subroutineName
    }

    this.eat("(");
    this.compileExpressionList();
    this.eat(")");
    this.eat(";");

    this.writeCloseTag("doStatement");
  }

  compileReturn(): void {
    this.writeOpenTag("returnStatement");

    this.eat("return");

    // expression?
    if (
      !(
        this.tokenizer.getCurrentRecord().type === TokenType.SYMBOL &&
        this.tokenizer.getCurrentRecord().lexeme === ";"
      )
    ) {
      this.compileExpression();
    }

    this.eat(";");

    this.writeCloseTag("returnStatement");
  }

  compileExpression(): void {
    this.writeOpenTag("expression");

    this.compileTerm();

    // (op term)*
    const ops = ["+", "-", "*", "/", "&", "|", "<", ">", "="];
    while (
      this.tokenizer.getCurrentRecord().type === TokenType.SYMBOL &&
      ops.includes(this.tokenizer.getCurrentRecord().lexeme)
    ) {
      this.eat(this.tokenizer.getCurrentRecord().lexeme); // op
      this.compileTerm();
    }

    this.writeCloseTag("expression");
  }

  compileTerm(): void {
    this.writeOpenTag("term");

    if (this.tokenizer.getCurrentRecord().type === TokenType.INTEGER_CONST) {
      this.eatType(TokenType.INTEGER_CONST);
    } else if (
      this.tokenizer.getCurrentRecord().type === TokenType.STRING_CONST
    ) {
      this.eatType(TokenType.STRING_CONST);
    } else if (
      this.tokenizer.getCurrentRecord().type === TokenType.KEYWORD &&
      (this.tokenizer.getCurrentRecord().lexeme === "true" ||
        this.tokenizer.getCurrentRecord().lexeme === "false" ||
        this.tokenizer.getCurrentRecord().lexeme === "null" ||
        this.tokenizer.getCurrentRecord().lexeme === "this")
    ) {
      this.eat(this.tokenizer.getCurrentRecord().lexeme); // keywordConstant
    } else if (this.tokenizer.getCurrentRecord().lexeme === "(") {
      this.eat("(");
      this.compileExpression();
      this.eat(")");
    } else if (
      this.tokenizer.getCurrentRecord().lexeme === "-" ||
      this.tokenizer.getCurrentRecord().lexeme === "~"
    ) {
      this.eat(this.tokenizer.getCurrentRecord().lexeme); // unaryOp
      this.compileTerm();
    } else if (
      this.tokenizer.getCurrentRecord().type === TokenType.IDENTIFIER
    ) {
      this.eatType(TokenType.IDENTIFIER); // varName or subroutineName or className

      if (this.tokenizer.getCurrentRecord().lexeme === "[") {
        // varName '[' expression ']'
        this.eat("[");
        this.compileExpression();
        this.eat("]");
      } else if (this.tokenizer.getCurrentRecord().lexeme === "(") {
        // subroutineName '(' expressionList ')'
        this.eat("(");
        this.compileExpressionList();
        this.eat(")");
      } else if (this.tokenizer.getCurrentRecord().lexeme === ".") {
        // (className | varName) '.' subroutineName '(' expressionList ')'
        this.eat(".");
        this.eatType(TokenType.IDENTIFIER); // subroutineName
        this.eat("(");
        this.compileExpressionList();
        this.eat(")");
      }
      // else → plain varName, already consumed
    }

    this.writeCloseTag("term");
  }

  compileExpressionList(): void {
    this.writeOpenTag("expressionList");

    // can be empty — check if next is ")"
    if (this.tokenizer.getCurrentRecord().lexeme !== ")") {
      this.compileExpression();

      while (
        this.tokenizer.getCurrentRecord().type === TokenType.SYMBOL &&
        this.tokenizer.getCurrentRecord().lexeme === ","
      ) {
        this.eat(",");
        this.compileExpression();
      }
    }

    this.writeCloseTag("expressionList");
  }

  eat(expectedToken: string): void {
    const currentRecord = this.tokenizer.getCurrentRecord();

    if (!this.isExpectedToken(currentRecord, expectedToken)) {
      throw new Error(
        `Expected token: ${expectedToken} but got: ${currentRecord.type} ${currentRecord.lexeme}`,
      );
    }

    this.writeToken(currentRecord);
    this.tokenizer.advance();
  }

  eatType(expectedType: TokenType): void {
    const currentRecord = this.tokenizer.getCurrentRecord();

    if (currentRecord.type !== expectedType) {
      throw new Error(
        `Expected type '${expectedType}' but got '${currentRecord.type}'`,
      );
    }

    this.writeToken(currentRecord);
    this.tokenizer.advance();
  }

  private writeToken(token: TokenRecord): void {
    switch (token.type) {
      case TokenType.KEYWORD:
        this.output += `<keyword>${token.lexeme}</keyword>\n`;
        break;
      case TokenType.SYMBOL:
        this.output += `<symbol>${this.escapeSymbol(token.lexeme)}</symbol>\n`;
        // this.output += `<symbol>${token.lexeme}</symbol>\n`;
        break;
      case TokenType.IDENTIFIER:
        this.output += `<identifier>${token.lexeme}</identifier>\n`;
        break;
      case TokenType.INTEGER_CONST:
        this.output += `<integerConstant>${token.lexeme}</integerConstant>\n`;
        break;
      case TokenType.STRING_CONST:
        this.output += `<stringConstant>${token.lexeme}</stringConstant>\n`;
        break;
    }
  }

  private escapeSymbol(symbol: string): string {
    switch (symbol) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      default:
        return symbol;
    }
  }

  private isExpectedToken(token: TokenRecord, expectedLexeme: string): boolean {
    return token.lexeme === expectedLexeme;
  }

  private writeOpenTag(tag: string): void {
    this.output += `<${tag}>\n`;
  }

  private writeCloseTag(tag: string): void {
    this.output += `</${tag}>\n`;
  }

  private writeOutput(): void {
    console.log(this.output);
  }

  /** Parsed XML tree produced by the parser. */
  public getOutput(): string {
    return this.output;
  }
}

export default Parser;

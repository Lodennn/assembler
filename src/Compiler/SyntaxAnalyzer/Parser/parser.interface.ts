import type { TokenRecord, TokenType } from "../Tokenizer/types";

interface IParser {
  // → outer shell, calls everything
  compileClass(): void;
  // → field/static declarations
  compileClassVarDec(): void;
  // → constructor/function/method
  compileSubroutine(): void;
  // → parameters inside ()
  compileParameterList(): void;
  // → { varDecs + statements }
  compileSubroutineBody(): void;
  // → var declarations
  compileVarDec(): void;
  // → routes to correct statement
  compileStatements(): void;
  // → let statement
  compileLet(): void;
  // → return statement
  compileReturn(): void;
  // → if / else
  compileIf(): void;
  // → while loop
  compileWhile(): void;
  // → do statement
  compileDo(): void;
  // → expression
  compileExpression(): void;
  // → term (hardest one)
  compileTerm(): void;
  // → comma separated expressions
  compileExpressionList(): void;
  // → eat
  eat(expectedValue: TokenType): void;
  // → eatType
  eatType(expectedValue: TokenType): void;
}

export type { IParser };

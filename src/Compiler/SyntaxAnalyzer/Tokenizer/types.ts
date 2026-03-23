export enum TokenType {
  KEYWORD = "KEYWORD",
  SYMBOL = "SYMBOL",
  IDENTIFIER = "IDENTIFIER",
  INTEGER_CONST = "INTEGER_CONST",
  STRING_CONST = "STRING_CONST",
}

/** One lexical token: `lexeme` is the keyword/symbol/identifier/int text; for strings it is inner text (no quotes). */
export type TokenRecord = {
  type: TokenType;
  lexeme: string;
};

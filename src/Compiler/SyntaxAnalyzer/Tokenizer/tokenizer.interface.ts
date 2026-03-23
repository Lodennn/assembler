import type { TokenRecord, TokenType } from "./types";

interface ITokenizer {
  // → move to next token
  advance(): void;
  // → boolean
  hasMoreTokens(): boolean;
  // → returns KEYWORD / SYMBOL / IDENTIFIER / INTEGER_CONST / STRING_CONST
  tokenType(): TokenType;
  // → returns value if current token is KEYWORD
  keyWord(): string;
  // → returns value if current token is SYMBOL
  symbol(): string;
  // → returns value if current token is IDENTIFIER
  identifier(): string;
  // → returns value if current token is INTEGER_CONST
  intVal(): string;
  // → returns value if current token is STRING_CONST
  stringVal(): string;
  // → returns the current token record
  getCurrentRecord(): TokenRecord;
}

export type { ITokenizer };

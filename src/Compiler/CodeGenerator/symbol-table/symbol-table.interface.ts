export interface ISymbolTable {
  define(name: string, type: string, kind: string): void;
  varCount(kind: string): number;
  kindOf(name: string): string;
  typeOf(name: string): string;
  indexOf(name: string): number;
}

export enum SymbolTableKindEnum {
  FIELD = "field",
  STATIC = "static",
  ARGUMENT = "argument",
  LOCAL = "local",
}

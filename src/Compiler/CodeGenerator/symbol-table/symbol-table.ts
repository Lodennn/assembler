import type { ISymbolTable } from "./symbol-table.interface.js";
import type { ISymbolTableRecord } from "./types.js";

class SymbolTable implements ISymbolTable {
  private static instance: SymbolTable;
  private class_symbol_table: Map<string, ISymbolTableRecord> = new Map(); // carries class variables (field, static) in kind
  private sub_routine_symbol_table: Map<string, ISymbolTableRecord> = new Map(); // carries arguments and local variables

  private field_symbol_table_count: number = 0;
  private static_symbol_table_count: number = 0;
  private argument_symbol_table_count: number = 0;
  private local_symbol_table_count: number = 0;

  static getInstance(): SymbolTable {
    if (!SymbolTable.instance) {
      SymbolTable.instance = new SymbolTable();
    }
    return SymbolTable.instance;
  }

  private reset_symbol_table_count(): void {
    this.field_symbol_table_count = 0;
    this.static_symbol_table_count = 0;
    this.argument_symbol_table_count = 0;
    this.local_symbol_table_count = 0;
  }

  private reset_symbol_table(): void {
    this.class_symbol_table.clear();
    this.sub_routine_symbol_table.clear();
  }

  private reset_tables(): void {
    this.reset_symbol_table_count();
    this.reset_symbol_table();
  }

  define(name: string, type: string, kind: string): void {
    const table =
      kind === "field" || kind === "static"
        ? this.class_symbol_table
        : this.sub_routine_symbol_table;

    const index = this.varCount(kind); // current count = next index

    table.set(name, { name, type, kind, index });

    // increment the right counter
    if (kind === "field") this.field_symbol_table_count++;
    if (kind === "static") this.static_symbol_table_count++;
    if (kind === "argument") this.argument_symbol_table_count++;
    if (kind === "local") this.local_symbol_table_count++;
  }

  varCount(kind: string): number {
    if (kind === "field") return this.field_symbol_table_count;
    if (kind === "static") return this.static_symbol_table_count;
    if (kind === "argument") return this.argument_symbol_table_count;
    if (kind === "local") return this.local_symbol_table_count;
    return 0;
  }

  kindOf(name: string): string {
    return (
      this.sub_routine_symbol_table.get(name)?.kind ??
      this.class_symbol_table.get(name)?.kind ??
      "NONE"
    );
  }

  typeOf(name: string): string {
    return (
      this.sub_routine_symbol_table.get(name)?.type ??
      this.class_symbol_table.get(name)?.type ??
      ""
    );
  }
  indexOf(name: string): number {
    return (
      this.sub_routine_symbol_table.get(name)?.index ??
      this.class_symbol_table.get(name)?.index ??
      -1
    );
  }

  startSubroutine(): void {
    this.sub_routine_symbol_table.clear();
    this.argument_symbol_table_count = 0;
    this.local_symbol_table_count = 0;
  }

  startClass(): void {
    this.reset_tables(); // reset everything including field/static counts
  }
}

export default SymbolTable;

export enum MemorySegmentsEnum {
  constant = "constant",
  local = "local",
  argument = "argument",
  this = "this",
  that = "that",
  temp = "temp",
  static = "static",
  pointer = "pointer",
}

export type TMemoryAccessCommand = {
  operation: string;
  segment: string;
  address: string;
};

export type TInitMemorySetter = {
  label: string;
  address: number;
  value: number;
};

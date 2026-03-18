import { MemorySegmentsEnum } from "./types.js";

export const MEMORY_ACCESS_OPERATORS: Record<string, boolean> = {
  push: true,
  pop: true,
};

export const MEMORY_SEGMENTS: Record<string, boolean> = {
  [MemorySegmentsEnum.constant]: true,
  [MemorySegmentsEnum.local]: true,
  [MemorySegmentsEnum.argument]: true,
  [MemorySegmentsEnum.this]: true,
  [MemorySegmentsEnum.that]: true,
  [MemorySegmentsEnum.temp]: true,
  [MemorySegmentsEnum.static]: true,
  [MemorySegmentsEnum.pointer]: true,
};

// Base addresses for segments
export const SEGMENT_BASE: Record<string, string> = {
  [MemorySegmentsEnum.local]: "LCL",
  [MemorySegmentsEnum.argument]: "ARG",
  [MemorySegmentsEnum.this]: "THIS",
  [MemorySegmentsEnum.that]: "THAT",
};

// Arithmetic operators
export const ARITHMETIC_OPERATORS: Record<string, boolean> = {
  add: true,
  sub: true,
  neg: true,
  eq: true,
  gt: true,
  lt: true,
  and: true,
  or: true,
  not: true,
};

export const TEMP_BASE = 5;
export const STATIC_BASE = 16;

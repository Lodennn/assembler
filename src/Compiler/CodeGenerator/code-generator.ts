import { parseXML, type XNode } from "../../services/xml-parser.js";
import type { ICodeGenerator } from "./code-generator.interface.js";
import SymbolTable from "./symbol-table/symbol-table.js";
import VMWriter from "./vm-writer/vm-writer.js";

class CodeGenerator implements ICodeGenerator {
  private static instance: CodeGenerator;
  private symbol_table: SymbolTable = SymbolTable.getInstance();
  private vm_writer: VMWriter = VMWriter.getInstance();
  private xmlRoot: XNode | null = null;
  private className: string = "";
  private labelCounter: number = 0;

  private constructor(parser_output: string) {
    console.log("parser_output", parser_output);
    const parsed_code = parseXML(parser_output);
    console.log("parsed_code", parsed_code);
    this.compile(parser_output);
    console.log("==", this.vm_writer.getOutput());
  }

  static getInstance(parser_output: string): CodeGenerator {
    if (!CodeGenerator.instance) {
      CodeGenerator.instance = new CodeGenerator(parser_output);
    } else {
      CodeGenerator.instance.compile(parser_output); // re-run on existing instance
    }
    return CodeGenerator.instance;
  }

  compile(parser_output: string): void {
    this.vm_writer.reset();
    this.xmlRoot = parseXML(parser_output.trim());
    this.compileClass(this.xmlRoot);
  }

  compileClass(node: XNode): void {
    this.symbol_table.startClass();

    const children = this.childrenOf(node);
    // children[0] = keyword "class"
    // children[1] = identifier (class name)
    // children[2] = symbol "{"
    // children[3..n-1] = classVarDec* and subroutineDec*
    // children[n] = symbol "}"

    this.className = this.text(
      children[1] ?? ({ tag: "", text: "", children: [] } as XNode),
    );

    for (const child of children) {
      if (child.tag === "classVarDec") {
        this.compileClassVarDec(child);
      } else if (child.tag === "subroutineDec") {
        this.compileSubroutineDec(child);
      }
    }
  }

  compileClassVarDec(node: XNode): void {
    const children = this.childrenOf(node);
    // children[0] = keyword "static"|"field"
    // children[1] = type (keyword or identifier)
    // children[2] = identifier (first var name)
    // then optional: symbol ",", identifier, ...
    // last = symbol ";"

    const kind = this.text(
      children[0] ?? ({ tag: "", text: "", children: [] } as XNode),
    ); // "static" or "field"
    const type = this.text(
      children[1] ?? ({ tag: "", text: "", children: [] } as XNode),
    ); // "int", "String", etc.
    const name = this.text(
      children[2] ?? ({ tag: "", text: "", children: [] } as XNode),
    ); // first variable name

    this.symbol_table.define(name, type, kind);

    let i = 3;
    while (
      i < children.length &&
      this.text(
        children[i] ?? ({ tag: "", text: "", children: [] } as XNode),
      ) === ","
    ) {
      this.symbol_table.define(
        this.text(
          children[i + 1] ?? ({ tag: "", text: "", children: [] } as XNode),
        ),
        type,
        kind,
      );
      i += 2;
    }
  }

  compileSubroutineDec(node: XNode): void {
    this.symbol_table.startSubroutine();

    const children = this.childrenOf(node);
    const subroutineType = this.text(this.nodeAt(children, 0)); // "method" | "function" | "constructor"
    const returnType = this.text(this.nodeAt(children, 1)); // "void" | "int" | etc.
    const name = this.text(this.nodeAt(children, 2)); // subroutine name

    // inject "this" as argument 0 BEFORE compiling parameter list
    if (subroutineType === "method") {
      this.symbol_table.define("this", this.className, "argument");
    }

    const paramListNode = this.childByTag(node, "parameterList")!;
    this.compileParameterList(paramListNode);

    const bodyNode = this.childByTag(node, "subroutineBody")!;

    // count locals before emitting function declaration
    const nLocals = this.countLocals(bodyNode);
    this.vm_writer.writeFunction(`${this.className}.${name}`, nLocals);

    // prologue depends on subroutine type
    if (subroutineType === "constructor") {
      const nFields = this.symbol_table.varCount("field");
      this.vm_writer.writePush("constant", nFields);
      this.vm_writer.writeCall("Memory.alloc", 1);
      this.vm_writer.writePop("pointer", 0);
    } else if (subroutineType === "method") {
      this.vm_writer.writePush("argument", 0);
      this.vm_writer.writePop("pointer", 0);
    }
    // "function" type: no prologue needed

    this.compileSubroutineBody(bodyNode, returnType);
  }

  private countLocals(bodyNode: XNode): number {
    let count = 0;
    for (const child of this.childrenOf(bodyNode)) {
      if (child.tag === "varDec") {
        const children = this.childrenOf(child);
        // children: var, type, name (, name)* ;
        // names = 1 + number of commas
        const commas = children.filter((k) => this.text(k) === ",").length;
        count += 1 + commas;
      }
    }
    return count;
  }

  compileParameterList(node: XNode): void {
    const children = this.childrenOf(node);
    let i = 0;
    while (i + 1 < children.length) {
      const typeNode = this.nodeAt(children, i);
      const nameNode = this.nodeAt(children, i + 1);
      if (this.text(typeNode) === ",") {
        i++;
        continue;
      }
      const type = this.text(typeNode);
      const name = this.text(nameNode);
      this.symbol_table.define(name, type, "argument");
      i += 2;
      if (i < children.length && this.text(this.nodeAt(children, i)) === ",") {
        i += 1;
      }
    }
  }

  compileSubroutineBody(node: XNode, returnType: string): void {
    for (const child of this.childrenOf(node)) {
      if (child.tag === "varDec") {
        this.compileVarDec(child);
      } else if (child.tag === "statements") {
        this.compileStatements(child, returnType);
      }
    }
  }

  compileVarDec(node: XNode): void {
    const children = this.childrenOf(node);
    const type = this.text(this.nodeAt(children, 1));
    const name = this.text(this.nodeAt(children, 2));
    this.symbol_table.define(name, type, "local");

    let i = 3;
    while (i < children.length && this.text(this.nodeAt(children, i)) === ",") {
      this.symbol_table.define(
        this.text(this.nodeAt(children, i + 1)),
        type,
        "local",
      );
      i += 2;
    }
  }

  compileStatements(node: XNode, returnType: string): void {
    for (const child of this.childrenOf(node)) {
      if (child.tag === "letStatement") this.compileLet(child);
      else if (child.tag === "ifStatement") this.compileIf(child, returnType);
      else if (child.tag === "whileStatement")
        this.compileWhile(child, returnType);
      else if (child.tag === "doStatement") this.compileDo(child);
      else if (child.tag === "returnStatement")
        this.compileReturn(child, returnType);
    }
  }

  compileLet(node: XNode): void {
    const children = this.childrenOf(node);
    // let varName = expression ;
    // let varName [ expression ] = expression ;

    const varName = this.text(this.nodeAt(children, 1));
    const isArray = this.text(this.nodeAt(children, 2)) === "[";

    if (isArray) {
      // children: let, varName, [, indexExpr, ], =, rhsExpr, ;
      const indexExpr = this.childByTag(node, "expression")!; // first expression = index
      const allExprs = this.childrenByTag(node, "expression");

      // push base address of array
      const seg = this.kindToSegment(this.symbol_table.kindOf(varName));
      const idx = this.symbol_table.indexOf(varName);
      this.vm_writer.writePush(seg, idx);

      // push index
      this.compileExpression(indexExpr);
      this.vm_writer.writeArithmetic("add"); // base + index = target address

      // compile rhs BEFORE setting pointer 1 (safe pattern)
      this.compileExpression(this.nodeAt(allExprs, 1));

      // now safely write to the target address
      this.vm_writer.writePop("temp", 0); // save rhs value
      this.vm_writer.writePop("pointer", 1); // set THAT = target address
      this.vm_writer.writePush("temp", 0); // restore rhs value
      this.vm_writer.writePop("that", 0); // arr[i] = rhs
    } else {
      // children: let, varName, =, expression, ;
      const exprNode = this.childByTag(node, "expression")!;
      this.compileExpression(exprNode);

      const seg = this.kindToSegment(this.symbol_table.kindOf(varName));
      const idx = this.symbol_table.indexOf(varName);
      this.vm_writer.writePop(seg, idx);
    }
  }

  compileIf(node: XNode, returnType: string): void {
    const labelFalse = this.newLabel("IF_FALSE");
    const labelEnd = this.newLabel("IF_END");

    const allExprs = this.childrenByTag(node, "expression");
    this.compileExpression(this.nodeAt(allExprs, 0)); // condition
    this.vm_writer.writeArithmetic("not");
    this.vm_writer.writeIf(labelFalse);

    const statementsNodes = this.childrenByTag(node, "statements");
    this.compileStatements(this.nodeAt(statementsNodes, 0), returnType); // true branch

    const hasElse = statementsNodes.length > 1;
    if (hasElse) {
      this.vm_writer.writeGoto(labelEnd);
      this.vm_writer.writeLabel(labelFalse);
      this.compileStatements(this.nodeAt(statementsNodes, 1), returnType); // else branch
      this.vm_writer.writeLabel(labelEnd);
    } else {
      this.vm_writer.writeLabel(labelFalse);
    }
  }

  compileWhile(node: XNode, returnType: string): void {
    const labelExp = this.newLabel("WHILE_EXP");
    const labelEnd = this.newLabel("WHILE_END");

    this.vm_writer.writeLabel(labelExp);

    const allExprs = this.childrenByTag(node, "expression");
    this.compileExpression(this.nodeAt(allExprs, 0)); // condition
    this.vm_writer.writeArithmetic("not");
    this.vm_writer.writeIf(labelEnd);

    const statementsNode = this.childByTag(node, "statements")!;
    this.compileStatements(statementsNode, returnType);

    this.vm_writer.writeGoto(labelExp);
    this.vm_writer.writeLabel(labelEnd);
  }

  compileDo(node: XNode): void {
    // do subroutineCall ;
    // the call is inside the node — delegate to compileSubroutineCall
    this.compileSubroutineCall(node);
    // do always discards the return value
    this.vm_writer.writePop("temp", 0);
  }

  compileReturn(node: XNode, returnType: string): void {
    const children = this.childrenOf(node);
    // children[0] = "return", then optional expression, then ";"

    const hasExpression = children.some((k) => k.tag === "expression");

    if (hasExpression) {
      const exprNode = this.childByTag(node, "expression")!;
      this.compileExpression(exprNode);
    } else {
      // void return — must push dummy value
      this.vm_writer.writePush("constant", 0);
    }

    this.vm_writer.writeReturn();
  }

  compileExpression(node: XNode): void {
    const children = this.childrenOf(node);
    // term (op term)*
    this.compileTerm(this.nodeAt(children, 0));

    let i = 1;
    while (i < children.length) {
      const op = this.text(this.nodeAt(children, i)); // operator symbol
      this.compileTerm(this.nodeAt(children, i + 1));
      this.writeOp(op);
      i += 2;
    }
  }

  private writeOp(op: string): void {
    switch (op) {
      case "+":
        this.vm_writer.writeArithmetic("add");
        break;
      case "-":
        this.vm_writer.writeArithmetic("sub");
        break;
      case "*":
        this.vm_writer.writeCall("Math.multiply", 2);
        break;
      case "/":
        this.vm_writer.writeCall("Math.divide", 2);
        break;
      case "&":
        this.vm_writer.writeArithmetic("and");
        break;
      case "|":
        this.vm_writer.writeArithmetic("or");
        break;
      case "<":
        this.vm_writer.writeArithmetic("lt");
        break;
      case ">":
        this.vm_writer.writeArithmetic("gt");
        break;
      case "=":
        this.vm_writer.writeArithmetic("eq");
        break;
    }
  }

  compileTerm(node: XNode): void {
    const children = this.childrenOf(node);
    const first = this.nodeAt(children, 0);
    const firstText = this.text(first);

    // integer constant
    if (first.tag === "integerConstant") {
      this.vm_writer.writePush("constant", parseInt(firstText));
      return;
    }

    // string constant
    if (first.tag === "stringConstant") {
      const str = firstText;
      this.vm_writer.writePush("constant", str.length);
      this.vm_writer.writeCall("String.new", 1);
      for (const ch of str) {
        this.vm_writer.writePush("constant", ch.charCodeAt(0));
        this.vm_writer.writeCall("String.appendChar", 2);
      }
      return;
    }

    // keyword constant: true, false, null, this
    if (first.tag === "keyword") {
      switch (firstText) {
        case "true":
          this.vm_writer.writePush("constant", 0);
          this.vm_writer.writeArithmetic("not");
          break;
        case "false":
        case "null":
          this.vm_writer.writePush("constant", 0);
          break;
        case "this":
          this.vm_writer.writePush("pointer", 0);
          break;
      }
      return;
    }

    // unary op: - or ~
    if (first.tag === "symbol" && (firstText === "-" || firstText === "~")) {
      this.compileTerm(this.nodeAt(children, 1));
      this.vm_writer.writeArithmetic(firstText === "-" ? "neg" : "not");
      return;
    }

    // grouped expression: ( expression )
    if (first.tag === "symbol" && firstText === "(") {
      this.compileExpression(this.nodeAt(children, 1));
      return;
    }

    // identifier — could be varName, varName[expr], or subroutineCall
    if (first.tag === "identifier") {
      const second = this.nodeAt(children, 1);
      const secondText = this.text(second);

      if (secondText === "[") {
        // array access: varName [ expression ]
        const seg = this.kindToSegment(this.symbol_table.kindOf(firstText));
        const idx = this.symbol_table.indexOf(firstText);
        this.vm_writer.writePush(seg, idx);
        this.compileExpression(this.nodeAt(children, 2)); // index expression
        this.vm_writer.writeArithmetic("add");
        this.vm_writer.writePop("pointer", 1);
        this.vm_writer.writePush("that", 0);
        return;
      }

      if (secondText === "(" || secondText === ".") {
        // subroutine call
        this.compileSubroutineCall(node);
        return;
      }

      // plain variable read
      const seg = this.kindToSegment(this.symbol_table.kindOf(firstText));
      const idx = this.symbol_table.indexOf(firstText);
      this.vm_writer.writePush(seg, idx);
    }
  }

  private childrenOf(node: XNode): XNode[] {
    return node.children;
  }

  /** Safe indexed access — TypeScript treats `arr[i]` as possibly undefined. */
  private nodeAt(children: XNode[], index: number): XNode {
    return children[index] ?? ({ tag: "", text: "", children: [] } as XNode);
  }

  private text(node: XNode): string {
    // leaf node — return its text directly
    if (node.children.length === 0) return node.text;
    // non-leaf — concatenate all descendant text (rarely needed)
    return node.children.map((c) => this.text(c)).join(" ");
  }

  private childByTag(node: XNode, tag: string): XNode | undefined {
    return node.children.find((c) => c.tag === tag);
  }

  private childrenByTag(node: XNode, tag: string): XNode[] {
    return node.children.filter((c) => c.tag === tag);
  }

  private compileSubroutineCall(node: XNode): void {
    const children = this.childrenOf(node);
    // skip leading "do" keyword if present
    const start = this.text(this.nodeAt(children, 0)) === "do" ? 1 : 0;

    const firstName = this.text(this.nodeAt(children, start));
    const secondText = this.text(this.nodeAt(children, start + 1));

    let callName: string;
    let nArgs = 0;
    let exprListNode: XNode;

    if (secondText === ".") {
      // className.subroutine(args)  OR  varName.method(args)
      const secondName = this.text(this.nodeAt(children, start + 2));
      const entry = this.symbol_table.kindOf(firstName);

      if (entry !== "NONE") {
        // firstName is a variable — it's a method call
        const seg = this.kindToSegment(entry);
        const idx = this.symbol_table.indexOf(firstName);
        this.vm_writer.writePush(seg, idx); // push object as arg 0
        callName = `${this.symbol_table.typeOf(firstName)}.${secondName}`;
        nArgs = 1; // the object counts as arg 0
      } else {
        // firstName is a class name — it's a function call
        callName = `${firstName}.${secondName}`;
        nArgs = 0;
      }
      exprListNode = this.childByTag(node, "expressionList")!;
    } else {
      // subroutine(args) — calling own method
      this.vm_writer.writePush("pointer", 0); // push "this"
      callName = `${this.className}.${firstName}`;
      nArgs = 1;
      exprListNode = this.childByTag(node, "expressionList")!;
    }

    nArgs += this.compileExpressionList(exprListNode);
    this.vm_writer.writeCall(callName, nArgs);
  }

  compileExpressionList(node: XNode): number {
    const expressions = this.childrenByTag(node, "expression");
    for (const expr of expressions) {
      this.compileExpression(expr);
    }
    return expressions.length;
  }
  private kindToSegment(kind: string): string {
    switch (kind) {
      case "field":
        return "this";
      case "static":
        return "static";
      case "argument":
        return "argument";
      case "local":
        return "local";
      default:
        return "";
    }
  }

  private newLabel(prefix: string): string {
    return `${prefix}${this.labelCounter++}`;
  }
}

export default CodeGenerator;

import type { XNode } from "../../services/xml-parser";

export interface ICodeGenerator {
  compile(xmlString: string): void;
  compileClass(node: XNode): void;
  compileClassVarDec(node: XNode): void;
  compileSubroutineDec(node: XNode): void;
  compileParameterList(node: XNode): void;
  compileSubroutineBody(node: XNode, returnType: string): void;
  compileVarDec(node: XNode): void;
  compileStatements(node: XNode, returnType: string): void;
  compileLet(node: XNode): void;
  compileIf(node: XNode, returnType: string): void;
  compileWhile(node: XNode, returnType: string): void;
  compileDo(node: XNode): void;
  compileReturn(node: XNode, returnType: string): void;
  compileExpression(node: XNode): void;
  compileTerm(node: XNode): void;
  compileExpressionList(node: XNode): number;
}

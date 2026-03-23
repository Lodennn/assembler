// class:           'class' className '{' classVarDec* subroutineDec* '}'
// classVarDec:     ('static' | 'field') type varName (',' varName)* ';'
// type:            'int' | 'char' | 'boolean' | className
// subroutineDec:   ('constructor' | 'function' | 'method')
//                  ('void' | type) subroutineName '(' parameterList ')'
//                  subroutineBody
// parameterList:   ((type varName) (',' type varName)*)?
// subroutineBody:  '{' varDec* statements '}'
// varDec:          'var' type varName (',' varName)* ';'
// className:       identifier
// subroutineName:  identifier
// varName:         identifier
// statements:      statement*
// statement:       letStatement | ifStatement | whileStatement
//                  | doStatement | returnStatement
// letStatement:    'let' varName ('[' expression ']')? '=' expression ';'
// ifStatement:     'if' '(' expression ')' '{' statements '}'
//                  ('else' '{' statements '}')?
// whileStatement:  'while' '(' expression ')' '{' statements '}'
// doStatement:     'do' subroutineCall ';'
// returnStatement: 'return' expression? ';'
// expression:      term (op term)*
// term:            integerConstant | stringConstant | keywordConstant
//                  | varName | varName '[' expression ']'
//                  | subroutineCall | '(' expression ')' | unaryOp term
// subroutineCall:  subroutineName '(' expressionList ')'
//                  | (className | varName) '.' subroutineName '(' expressionList ')'
// expressionList:  (expression (',' expression)*)?
// op:              '+' | '-' | '*' | '/' | '&' | '|' | '<' | '>' | '='
// unaryOp:         '-' | '~'
// keywordConstant: 'true' | 'false' | 'null' | 'this'

const JACK_GRAMMAR = {
  // program structure
  class: {
    rule: "'class' className '{' classVarDec* subroutineDec* '}'",
    starts_with: ["class"],
    method: "compileClass",
  },
  classVarDec: {
    rule: "('static' | 'field') type varName (',' varName)* ';'",
    starts_with: ["static", "field"],
    method: "compileClassVarDec",
  },
  subroutineDec: {
    rule: "('constructor' | 'function' | 'method') ('void' | type) subroutineName '(' parameterList ')' subroutineBody",
    starts_with: ["constructor", "function", "method"],
    method: "compileSubroutine",
  },
  parameterList: {
    rule: "((type varName) (',' type varName)*)?",
    starts_with: ["int", "char", "boolean", "identifier"],
    method: "compileParameterList",
  },
  subroutineBody: {
    rule: "'{' varDec* statements '}'",
    starts_with: ["{"],
    method: "compileSubroutineBody",
  },
  varDec: {
    rule: "'var' type varName (',' varName)* ';'",
    starts_with: ["var"],
    method: "compileVarDec",
  },

  // statements
  statements: {
    rule: "statement*",
    starts_with: ["let", "if", "while", "do", "return"],
    method: "compileStatements",
  },
  statement: {
    rule: "letStatement | ifStatement | whileStatement | doStatement | returnStatement",
    starts_with: ["let", "if", "while", "do", "return"],
    method: "compileStatement",
  },
  letStatement: {
    rule: "'let' varName ('[' expression ']')? '=' expression ';'",
    starts_with: ["let"],
    method: "compileLet",
  },
  ifStatement: {
    rule: "'if' '(' expression ')' '{' statements '}' ('else' '{' statements '}')?",
    starts_with: ["if"],
    method: "compileIf",
  },
  whileStatement: {
    rule: "'while' '(' expression ')' '{' statements '}'",
    starts_with: ["while"],
    method: "compileWhile",
  },
  doStatement: {
    rule: "'do' subroutineCall ';'",
    starts_with: ["do"],
    method: "compileDo",
  },
  returnStatement: {
    rule: "'return' expression? ';'",
    starts_with: ["return"],
    method: "compileReturn",
  },

  // expressions
  expression: {
    rule: "term (op term)*",
    starts_with: [
      "integerConstant",
      "stringConstant",
      "true",
      "false",
      "null",
      "this",
      "identifier",
      "(",
      "-",
      "~",
    ],
    method: "compileExpression",
  },
  term: {
    rule: "integerConstant | stringConstant | keywordConstant | varName | varName '[' expression ']' | subroutineCall | '(' expression ')' | unaryOp term",
    starts_with: [
      "integerConstant",
      "stringConstant",
      "true",
      "false",
      "null",
      "this",
      "identifier",
      "(",
      "-",
      "~",
    ],
    method: "compileTerm",
  },
  expressionList: {
    rule: "(expression (',' expression)*)?",
    starts_with: [
      "integerConstant",
      "stringConstant",
      "true",
      "false",
      "null",
      "this",
      "identifier",
      "(",
      "-",
      "~",
    ],
    method: "compileExpressionList",
  },

  // terminals — no methods, handled inline
  type: {
    rule: "'int' | 'char' | 'boolean' | className",
    starts_with: ["int", "char", "boolean", "identifier"],
    method: null,
  },
  op: {
    rule: "'+' | '-' | '*' | '/' | '&' | '|' | '<' | '>' | '='",
    starts_with: ["+", "-", "*", "/", "&", "|", "<", ">", "="],
    method: null,
  },
  unaryOp: {
    rule: "'-' | '~'",
    starts_with: ["-", "~"],
    method: null,
  },
  keywordConstant: {
    rule: "'true' | 'false' | 'null' | 'this'",
    starts_with: ["true", "false", "null", "this"],
    method: null,
  },
  className: {
    rule: "identifier",
    starts_with: ["identifier"],
    method: null,
  },
  subroutineName: {
    rule: "identifier",
    starts_with: ["identifier"],
    method: null,
  },
  varName: {
    rule: "identifier",
    starts_with: ["identifier"],
    method: null,
  },
} as const;

export default JACK_GRAMMAR;

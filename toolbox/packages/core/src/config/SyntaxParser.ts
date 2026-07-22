import { EventBus } from "../events/EventBus";

export enum TokenType {
  COMMAND = "COMMAND",
  IDENTIFIER = "IDENTIFIER",
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  ARROW = "ARROW",
  LBRACE = "LBRACE",
  RBRACE = "RBRACE",
  LBRACKET = "LBRACKET",
  RBRACKET = "RBRACKET",
  LPAREN = "LPAREN",
  RPAREN = "RPAREN",
  COMMA = "COMMA",
  DOT = "DOT",
  COLON = "COLON",
  SEMICOLON = "SEMICOLON",
  OPERATOR = "OPERATOR",
  COMMENT = "COMMENT",
  EOF = "EOF",
}

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column?: number;
}

interface ASTNode {
  type: string;
  [key: string]: any;
}

export class SyntaxParser {
  private tokens: Token[] = [];
  private current = 0;
  private variables: Map<string, any> = new Map();

  parse(code: string): ASTNode[] {
    this.current = 0;
    this.tokenize(code);
    return this.parseProgram();
  }

  private tokenize(code: string): void {
    this.tokens = [];
    let i = 0;
    let line = 1;
    let col = 1;

    const addToken = (type: TokenType, value: string) => {
      const token: Token = { type, value, line };
      this.tokens.push(token);
    };

    while (i < code.length) {
      const ch = code[i];

      if (ch === "\n") {
        line++;
        col = 1;
        i++;
        continue;
      }

      if (ch === " " || ch === "\t" || ch === "\r") {
        col++;
        i++;
        continue;
      }

      if (ch === "#") {
        let comment = "";
        while (i < code.length && code[i] !== "\n") {
          comment += code[i];
          i++;
          col++;
        }
        addToken(TokenType.COMMENT, comment);
        continue;
      }

      if (ch === '"' || ch === "'") {
        const quote = ch;
        let str = "";
        i++;
        col++;
        while (i < code.length && code[i] !== quote) {
          if (code[i] === "\\") {
            i++;
            col++;
            const escape: Record<string, string> = { n: "\n", t: "\t", r: "\r", '"': '"', "'": "'" };
            str += escape[code[i]] || code[i];
          } else {
            str += code[i];
          }
          i++;
          col++;
        }
        i++;
        col++;
        addToken(TokenType.STRING, str);
        continue;
      }

      if (/[0-9]/.test(ch)) {
        let num = "";
        while (i < code.length && /[0-9.]/.test(code[i])) {
          num += code[i];
          i++;
          col++;
        }
        addToken(TokenType.NUMBER, num);
        continue;
      }

      if (/[a-zA-Z_]/.test(ch)) {
        let ident = "";
        while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
          ident += code[i];
          i++;
          col++;
        }
        addToken(TokenType.IDENTIFIER, ident);
        continue;
      }

      if (ch === "{" ) { addToken(TokenType.LBRACE, "{"); i++; col++; continue; }
      if (ch === "}" ) { addToken(TokenType.RBRACE, "}"); i++; col++; continue; }
      if (ch === "[" ) { addToken(TokenType.LBRACKET, "["); i++; col++; continue; }
      if (ch === "]" ) { addToken(TokenType.RBRACKET, "]"); i++; col++; continue; }
      if (ch === "(" ) { addToken(TokenType.LPAREN, "("); i++; col++; continue; }
      if (ch === ")" ) { addToken(TokenType.RPAREN, ")"); i++; col++; continue; }
      if (ch === "," ) { addToken(TokenType.COMMA, ","); i++; col++; continue; }
      if (ch === "." ) { addToken(TokenType.DOT, "."); i++; col++; continue; }
      if (ch === ":" ) { addToken(TokenType.COLON, ":"); i++; col++; continue; }
      if (ch === ";" ) { addToken(TokenType.SEMICOLON, ";"); i++; col++; continue; }

      if (ch === "-" && code[i + 1] === ">") {
        addToken(TokenType.ARROW, "->");
        i += 2;
        col += 2;
        continue;
      }

      if (/[=!<>+\-*/&|]/.test(ch)) {
        let op = ch;
        i++;
        col++;
        if (i < code.length && code[i] === "=") {
          op += "=";
          i++;
          col++;
        }
        addToken(TokenType.OPERATOR, op);
        continue;
      }

      col++;
      i++;
    }

    addToken(TokenType.EOF, "EOF");
  }

  private parseProgram(): ASTNode[] {
    const nodes: ASTNode[] = [];
    while (!this.isAtEnd()) {
      const node = this.parseStatement();
      if (node) nodes.push(node);
    }
    return nodes;
  }

  private parseStatement(): ASTNode | null {
    this.skipComments();

    if (this.isAtEnd()) return null;

    if (this.check(TokenType.IDENTIFIER)) {
      const keyword = this.peek().value;

      switch (keyword) {
        case "set":
          return this.parseSetStatement();
        case "get":
          return this.parseGetStatement();
        case "log":
          return this.parseLogStatement();
        case "if":
          return this.parseIfStatement();
        case "for":
          return this.parseForStatement();
        case "while":
          return this.parseWhileStatement();
        case "function":
          return this.parseFunctionStatement();
        case "return":
          return this.parseReturnStatement();
        case "try":
          return this.parseTryStatement();
        case "throw":
          return this.parseThrowStatement();
        case "storage":
        case "config":
        case "api":
        case "event":
        case "mod":
        case "task":
        case "plugin":
        case "language":
        case "discord":
        case "notify":
        case "secret":
        case "env":
        case "ai":
        case "queue":
        case "test":
        case "migration":
        case "validate":
        case "render":
        case "pipe":
        case "stream":
        case "debug":
        case "profile":
        case "using":
        case "template":
          return this.parseToolboxCommand();
        default:
          return this.parseExpressionStatement();
      }
    }

    if (this.check(TokenType.LBRACE)) {
      if (this.isObjectLiteral()) {
        return { type: "ExpressionStatement", expression: this.parseObjectLiteral() };
      }
      return this.parseBlock();
    }

    if (this.check(TokenType.LBRACKET)) {
      return { type: "ExpressionStatement", expression: this.parseArrayLiteral() };
    }

    this.advance();
    return null;
  }

  private parseSetStatement(): ASTNode {
    this.consume(TokenType.IDENTIFIER, "set");
    const name = this.consume(TokenType.IDENTIFIER, "variable name").value;
    const value = this.parseExpression();
    return { type: "SetStatement", name, value };
  }

  private parseGetStatement(): ASTNode {
    this.consume(TokenType.IDENTIFIER, "get");
    const name = this.consume(TokenType.IDENTIFIER, "variable name").value;
    return { type: "GetStatement", name };
  }

  private parseLogStatement(): ASTNode {
    this.consume(TokenType.IDENTIFIER, "log");
    let level = "info";
    if (this.check(TokenType.IDENTIFIER) && ["info", "warn", "error", "debug", "success"].includes(this.peek().value)) {
      level = this.advance().value;
    }
    const message = this.parseExpression();
    return { type: "LogStatement", level, message };
  }

  private parseIfStatement(): ASTNode {
    this.consume(TokenType.IDENTIFIER, "if");
    const condition = this.parseExpression();
    const thenBlock = this.parseBlock();
    let elseBlock: ASTNode | null = null;
    if (this.check(TokenType.IDENTIFIER) && this.peek().value === "else") {
      this.advance();
      elseBlock = this.parseBlock();
    }
    return { type: "IfStatement", condition, thenBlock, elseBlock };
  }

  private parseForStatement(): ASTNode {
    this.consume(TokenType.IDENTIFIER, "for");
    const variable = this.consume(TokenType.IDENTIFIER, "loop variable").value;
    this.consume(TokenType.IDENTIFIER, "in");
    const iterable = this.parseExpression();
    const body = this.parseBlock();
    return { type: "ForStatement", variable, iterable, body };
  }

  private parseWhileStatement(): ASTNode {
    this.consume(TokenType.IDENTIFIER, "while");
    const condition = this.parseExpression();
    const body = this.parseBlock();
    return { type: "WhileStatement", condition, body };
  }

  private parseFunctionStatement(): ASTNode {
    this.consume(TokenType.IDENTIFIER, "function");
    const name = this.consume(TokenType.IDENTIFIER, "function name").value;
    this.consume(TokenType.LPAREN, "(");
    const params: string[] = [];
    while (!this.check(TokenType.RPAREN) && !this.isAtEnd()) {
      params.push(this.consume(TokenType.IDENTIFIER, "parameter").value);
      if (this.check(TokenType.COMMA)) this.advance();
    }
    this.consume(TokenType.RPAREN, ")");
    const body = this.parseBlock();
    return { type: "FunctionStatement", name, params, body };
  }

  private parseReturnStatement(): ASTNode {
    this.consume(TokenType.IDENTIFIER, "return");
    const value = this.parseExpression();
    return { type: "ReturnStatement", value };
  }

  private parseTryStatement(): ASTNode {
    this.consume(TokenType.IDENTIFIER, "try");
    const tryBlock = this.parseBlock();
    let catchBlock: ASTNode | null = null;
    let catchVar = "error";
    if (this.check(TokenType.IDENTIFIER) && this.peek().value === "catch") {
      this.advance();
      if (this.check(TokenType.IDENTIFIER)) {
        catchVar = this.advance().value;
      }
      catchBlock = this.parseBlock();
    }
    let finallyBlock: ASTNode | null = null;
    if (this.check(TokenType.IDENTIFIER) && this.peek().value === "finally") {
      this.advance();
      finallyBlock = this.parseBlock();
    }
    return { type: "TryStatement", tryBlock, catchBlock, catchVar, finallyBlock };
  }

  private parseThrowStatement(): ASTNode {
    this.consume(TokenType.IDENTIFIER, "throw");
    const value = this.parseExpression();
    return { type: "ThrowStatement", value };
  }

  private parseToolboxCommand(): ASTNode {
    const command = this.advance().value;
    const args: ASTNode[] = [];

    let block: ASTNode | null = null;

    while (!this.isAtEnd() && !this.check(TokenType.LBRACE) && !this.check(TokenType.SEMICOLON)) {
      if (this.check(TokenType.ARROW)) {
        this.advance();
        if (this.check(TokenType.LBRACE)) {
          block = this.parseBlock();
        } else if (this.check(TokenType.IDENTIFIER)) {
          args.push(this.parseExpression());
        }
        break;
      }
      args.push(this.parseExpression());
    }

    if (!block && this.check(TokenType.LBRACE)) {
      block = this.parseBlock();
    }

    if (this.check(TokenType.SEMICOLON)) this.advance();

    return { type: "ToolboxCommand", command, args, block };
  }

  private parseExpressionStatement(): ASTNode {
    const expr = this.parseExpression();
    return { type: "ExpressionStatement", expression: expr };
  }

  private parseExpression(): ASTNode {
    return this.parseAssignment();
  }

  private parseAssignment(): ASTNode {
    let left = this.parseLogicalOr();

    if (this.check(TokenType.OPERATOR) && ["=", "+=", "-="].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseAssignment();
      left = { type: "Assignment", operator: op, left, right };
    }

    return left;
  }

  private parseLogicalOr(): ASTNode {
    let left = this.parseLogicalAnd();

    while (this.check(TokenType.OPERATOR) && this.peek().value === "||") {
      const op = this.advance().value;
      const right = this.parseLogicalAnd();
      left = { type: "LogicalOp", operator: op, left, right };
    }

    return left;
  }

  private parseLogicalAnd(): ASTNode {
    let left = this.parseEquality();

    while (this.check(TokenType.OPERATOR) && this.peek().value === "&&") {
      const op = this.advance().value;
      const right = this.parseEquality();
      left = { type: "LogicalOp", operator: op, left, right };
    }

    return left;
  }

  private parseEquality(): ASTNode {
    let left = this.parseComparison();

    while (this.check(TokenType.OPERATOR) && ["==", "!="].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseComparison();
      left = { type: "BinaryOp", operator: op, left, right };
    }

    return left;
  }

  private parseComparison(): ASTNode {
    let left = this.parseTerm();

    while (this.check(TokenType.OPERATOR) && [">", "<", ">=", "<="].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseTerm();
      left = { type: "BinaryOp", operator: op, left, right };
    }

    return left;
  }

  private parseTerm(): ASTNode {
    let left = this.parseFactor();

    while (this.check(TokenType.OPERATOR) && ["+", "-"].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseFactor();
      left = { type: "BinaryOp", operator: op, left, right };
    }

    return left;
  }

  private parseFactor(): ASTNode {
    let left = this.parseUnary();

    while (this.check(TokenType.OPERATOR) && ["*", "/", "%"].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = { type: "BinaryOp", operator: op, left, right };
    }

    return left;
  }

  private parseUnary(): ASTNode {
    if (this.check(TokenType.OPERATOR) && ["!", "-"].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseUnary();
      return { type: "UnaryOp", operator: op, right };
    }
    return this.parseCall();
  }

  private parseCall(): ASTNode {
    let callee = this.parsePrimary();

    while (true) {
      if (this.check(TokenType.LPAREN)) {
        this.advance();
        const args: ASTNode[] = [];
        while (!this.check(TokenType.RPAREN) && !this.isAtEnd()) {
          args.push(this.parseExpression());
          if (this.check(TokenType.COMMA)) this.advance();
        }
        this.consume(TokenType.RPAREN, ")");
        callee = { type: "Call", callee, args };
      } else if (this.check(TokenType.DOT)) {
        this.advance();
        const property = this.consume(TokenType.IDENTIFIER, "property name").value;
        callee = { type: "MemberAccess", object: callee, property };
      } else if (this.check(TokenType.LBRACKET)) {
        this.advance();
        const index = this.parseExpression();
        this.consume(TokenType.RBRACKET, "]");
        callee = { type: "IndexAccess", object: callee, index };
      } else {
        break;
      }
    }

    return callee;
  }

  private parsePrimary(): ASTNode {
    this.skipComments();

    if (this.check(TokenType.STRING)) {
      return { type: "StringLiteral", value: this.advance().value };
    }

    if (this.check(TokenType.NUMBER)) {
      return { type: "NumberLiteral", value: parseFloat(this.advance().value) };
    }

    if (this.check(TokenType.IDENTIFIER)) {
      const value = this.advance().value;
      if (value === "true") return { type: "BooleanLiteral", value: true };
      if (value === "false") return { type: "BooleanLiteral", value: false };
      if (value === "null") return { type: "NullLiteral", value: null };
      return { type: "Identifier", name: value };
    }

    if (this.check(TokenType.LPAREN)) {
      this.advance();
      const expr = this.parseExpression();
      this.consume(TokenType.RPAREN, ")");
      return expr;
    }

    if (this.check(TokenType.LBRACKET)) {
      return this.parseArrayLiteral();
    }

    if (this.check(TokenType.LBRACE)) {
      return this.parseObjectLiteral();
    }

    throw new Error(`Unexpected token: ${this.peek().value} at line ${this.peek().line}`);
  }

  private parseArrayLiteral(): ASTNode {
    this.consume(TokenType.LBRACKET, "[");
    const elements: ASTNode[] = [];
    while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
      elements.push(this.parseExpression());
      if (this.check(TokenType.COMMA)) this.advance();
    }
    this.consume(TokenType.RBRACKET, "]");
    return { type: "ArrayLiteral", elements };
  }

  private parseObjectLiteral(): ASTNode {
    this.consume(TokenType.LBRACE, "{");
    const properties: Array<{ key: ASTNode; value: ASTNode }> = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const key = this.parseExpression();
      this.consume(TokenType.COLON, ":");
      const value = this.parseExpression();
      properties.push({ key, value });
      if (this.check(TokenType.COMMA)) this.advance();
    }
    this.consume(TokenType.RBRACE, "}");
    return { type: "ObjectLiteral", properties };
  }

  private parseBlock(): ASTNode {
    this.consume(TokenType.LBRACE, "{");
    const statements: ASTNode[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }
    this.consume(TokenType.RBRACE, "}");
    return { type: "Block", statements };
  }

  private isObjectLiteral(): boolean {
    const saved = this.current;
    this.advance();
    this.skipComments();
    const result = this.check(TokenType.STRING) || this.check(TokenType.IDENTIFIER);
    this.current = saved;
    return result;
  }

  private skipComments(): void {
    while (this.check(TokenType.COMMENT)) {
      this.advance();
    }
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.current >= this.tokens.length || this.peek().type === TokenType.EOF;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(`${message} expected at line ${this.peek().line}`);
  }
}

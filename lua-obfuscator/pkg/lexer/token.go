// Package lexer implements a complete Lua 5.1 lexer.
// Tokenization strictly follows the Lua 5.1 reference manual grammar §9.
package lexer

import "fmt"

// TokenType identifies the category of a lexical token.
type TokenType int

const (
	// Literals
	TOKEN_NUMBER TokenType = iota
	TOKEN_STRING
	TOKEN_NAME
	TOKEN_EOF

	// Keywords (22 total in Lua 5.1)
	TOKEN_AND
	TOKEN_BREAK
	TOKEN_DO
	TOKEN_ELSE
	TOKEN_ELSEIF
	TOKEN_END
	TOKEN_FALSE
	TOKEN_FOR
	TOKEN_FUNCTION
	TOKEN_IF
	TOKEN_IN
	TOKEN_LOCAL
	TOKEN_NIL
	TOKEN_NOT
	TOKEN_OR
	TOKEN_REPEAT
	TOKEN_RETURN
	TOKEN_THEN
	TOKEN_TRUE
	TOKEN_UNTIL
	TOKEN_WHILE

	// Operators and punctuation
	TOKEN_PLUS       // +
	TOKEN_MINUS      // -
	TOKEN_STAR       // *
	TOKEN_SLASH      // /
	TOKEN_PERCENT    // %
	TOKEN_CARET      // ^
	TOKEN_HASH       // #
	TOKEN_EQ         // ==
	TOKEN_NEQ        // ~=
	TOKEN_LT         // <
	TOKEN_LE         // <=
	TOKEN_GT         // >
	TOKEN_GE         // >=
	TOKEN_ASSIGN     // =
	TOKEN_LPAREN     // (
	TOKEN_RPAREN     // )
	TOKEN_LBRACE     // {
	TOKEN_RBRACE     // }
	TOKEN_LBRACKET   // [
	TOKEN_RBRACKET   // ]
	TOKEN_SEMICOLON  // ;
	TOKEN_COLON      // :
	TOKEN_COMMA      // ,
	TOKEN_DOT        // .
	TOKEN_DOTDOT     // ..
	TOKEN_DOTDOTDOT  // ...
)

var tokenNames = map[TokenType]string{
	TOKEN_NUMBER: "NUMBER", TOKEN_STRING: "STRING", TOKEN_NAME: "NAME", TOKEN_EOF: "EOF",
	TOKEN_AND: "and", TOKEN_BREAK: "break", TOKEN_DO: "do", TOKEN_ELSE: "else",
	TOKEN_ELSEIF: "elseif", TOKEN_END: "end", TOKEN_FALSE: "false", TOKEN_FOR: "for",
	TOKEN_FUNCTION: "function", TOKEN_IF: "if", TOKEN_IN: "in", TOKEN_LOCAL: "local",
	TOKEN_NIL: "nil", TOKEN_NOT: "not", TOKEN_OR: "or", TOKEN_REPEAT: "repeat",
	TOKEN_RETURN: "return", TOKEN_THEN: "then", TOKEN_TRUE: "true", TOKEN_UNTIL: "until",
	TOKEN_WHILE: "while",
	TOKEN_PLUS: "+", TOKEN_MINUS: "-", TOKEN_STAR: "*", TOKEN_SLASH: "/",
	TOKEN_PERCENT: "%", TOKEN_CARET: "^", TOKEN_HASH: "#",
	TOKEN_EQ: "==", TOKEN_NEQ: "~=", TOKEN_LT: "<", TOKEN_LE: "<=",
	TOKEN_GT: ">", TOKEN_GE: ">=", TOKEN_ASSIGN: "=",
	TOKEN_LPAREN: "(", TOKEN_RPAREN: ")", TOKEN_LBRACE: "{", TOKEN_RBRACE: "}",
	TOKEN_LBRACKET: "[", TOKEN_RBRACKET: "]",
	TOKEN_SEMICOLON: ";", TOKEN_COLON: ":", TOKEN_COMMA: ",",
	TOKEN_DOT: ".", TOKEN_DOTDOT: "..", TOKEN_DOTDOTDOT: "...",
}

// String returns the display name of a token type.
func (t TokenType) String() string {
	if s, ok := tokenNames[t]; ok {
		return s
	}
	return fmt.Sprintf("TOKEN(%d)", int(t))
}

// keywords maps Lua 5.1 reserved words to their token types.
var keywords = map[string]TokenType{
	"and": TOKEN_AND, "break": TOKEN_BREAK, "do": TOKEN_DO, "else": TOKEN_ELSE,
	"elseif": TOKEN_ELSEIF, "end": TOKEN_END, "false": TOKEN_FALSE, "for": TOKEN_FOR,
	"function": TOKEN_FUNCTION, "if": TOKEN_IF, "in": TOKEN_IN, "local": TOKEN_LOCAL,
	"nil": TOKEN_NIL, "not": TOKEN_NOT, "or": TOKEN_OR, "repeat": TOKEN_REPEAT,
	"return": TOKEN_RETURN, "then": TOKEN_THEN, "true": TOKEN_TRUE, "until": TOKEN_UNTIL,
	"while": TOKEN_WHILE,
}

// IsKeyword reports whether name is a Lua 5.1 keyword.
func IsKeyword(name string) bool {
	_, ok := keywords[name]
	return ok
}

// Token is a single lexical unit with source location.
type Token struct {
	Type   TokenType
	Value  string // decoded string value or raw numeric/name text
	Line   int
	Column int
}

func (t Token) String() string {
	return fmt.Sprintf("Token{%s %q L%d:C%d}", t.Type, t.Value, t.Line, t.Column)
}

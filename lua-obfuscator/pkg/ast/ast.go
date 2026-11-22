// Package ast defines the abstract syntax tree for Lua 5.1.
// Every node records its source position to enable accurate error messages
// and source-map generation in later compiler passes.
package ast

import "fmt"

// ----------------------------------------------------------------------------
// Position
// ----------------------------------------------------------------------------

// Pos records a source location as (line, column), both 1-indexed.
type Pos struct {
	Line   int
	Column int
}

func (p Pos) String() string {
	return fmt.Sprintf("%d:%d", p.Line, p.Column)
}

// ----------------------------------------------------------------------------
// Node interface
// ----------------------------------------------------------------------------

// Node is the common interface for every AST node.
type Node interface {
	nodePos() Pos
}

// Stmt is any statement node.
type Stmt interface {
	Node
	stmtNode()
}

// Expr is any expression node.
type Expr interface {
	Node
	exprNode()
}

// ----------------------------------------------------------------------------
// Statements
// ----------------------------------------------------------------------------

// Block is an ordered list of statements (the body of a chunk or function).
type Block struct {
	Pos   Pos
	Stmts []Stmt
}

func (b *Block) nodePos() Pos { return b.Pos }
func (b *Block) stmtNode()    {}

// AssignStmt represents one or more assignments: varlist = exprlist
type AssignStmt struct {
	Pos     Pos
	Targets []Expr // LHS: Name | IndexExpr | FieldExpr
	Values  []Expr // RHS
}

func (s *AssignStmt) nodePos() Pos { return s.Pos }
func (s *AssignStmt) stmtNode()    {}

// LocalAssignStmt represents local name {, name} [= exprlist]
type LocalAssignStmt struct {
	Pos    Pos
	Names  []string
	Attribs []string // Lua 5.4 attribs (empty in 5.1, stored for forward compat)
	Values []Expr
}

func (s *LocalAssignStmt) nodePos() Pos { return s.Pos }
func (s *LocalAssignStmt) stmtNode()    {}

// FuncCallStmt wraps a function-call expression used as a statement.
type FuncCallStmt struct {
	Pos  Pos
	Call Expr // *CallExpr or *MethodCallExpr
}

func (s *FuncCallStmt) nodePos() Pos { return s.Pos }
func (s *FuncCallStmt) stmtNode()    {}

// DoStmt is a do … end block.
type DoStmt struct {
	Pos  Pos
	Body *Block
}

func (s *DoStmt) nodePos() Pos { return s.Pos }
func (s *DoStmt) stmtNode()    {}

// WhileStmt is while cond do body end.
type WhileStmt struct {
	Pos  Pos
	Cond Expr
	Body *Block
}

func (s *WhileStmt) nodePos() Pos { return s.Pos }
func (s *WhileStmt) stmtNode()    {}

// RepeatStmt is repeat body until cond.
type RepeatStmt struct {
	Pos  Pos
	Body *Block
	Cond Expr
}

func (s *RepeatStmt) nodePos() Pos { return s.Pos }
func (s *RepeatStmt) stmtNode()    {}

// IfStmt represents if / elseif / else chains.
type IfStmt struct {
	Pos     Pos
	Cond    Expr
	Then    *Block
	ElseIfs []ElseIf
	Else    *Block // nil if absent
}

func (s *IfStmt) nodePos() Pos { return s.Pos }
func (s *IfStmt) stmtNode()    {}

// ElseIf holds one elseif clause.
type ElseIf struct {
	Pos  Pos
	Cond Expr
	Body *Block
}

// ForNumStmt is the numeric for: for name = start, limit [, step] do body end
type ForNumStmt struct {
	Pos   Pos
	Name  string
	Start Expr
	Limit Expr
	Step  Expr // nil means implicit 1
	Body  *Block
}

func (s *ForNumStmt) nodePos() Pos { return s.Pos }
func (s *ForNumStmt) stmtNode()    {}

// ForGenericStmt is the generic for: for namelist in exprlist do body end
type ForGenericStmt struct {
	Pos    Pos
	Names  []string
	Iters  []Expr
	Body   *Block
}

func (s *ForGenericStmt) nodePos() Pos { return s.Pos }
func (s *ForGenericStmt) stmtNode()    {}

// FuncDefStmt is function name[.field]* [:method] funcbody
type FuncDefStmt struct {
	Pos    Pos
	Name   FuncName
	Func   *FuncExpr
}

func (s *FuncDefStmt) nodePos() Pos { return s.Pos }
func (s *FuncDefStmt) stmtNode()    {}

// LocalFuncDefStmt is local function name funcbody
type LocalFuncDefStmt struct {
	Pos  Pos
	Name string
	Func *FuncExpr
}

func (s *LocalFuncDefStmt) nodePos() Pos { return s.Pos }
func (s *LocalFuncDefStmt) stmtNode()    {}

// ReturnStmt is return [exprlist] [;]
type ReturnStmt struct {
	Pos    Pos
	Values []Expr
}

func (s *ReturnStmt) nodePos() Pos { return s.Pos }
func (s *ReturnStmt) stmtNode()    {}

// BreakStmt is the break statement.
type BreakStmt struct {
	Pos Pos
}

func (s *BreakStmt) nodePos() Pos { return s.Pos }
func (s *BreakStmt) stmtNode()    {}

// ----------------------------------------------------------------------------
// Function name (for FuncDefStmt)
// ----------------------------------------------------------------------------

// FuncName represents the full dotted / method name in function definitions.
type FuncName struct {
	Names  []string // e.g. ["a","b","c"] for a.b.c
	Method string   // non-empty for a.b.c:method
}

// ----------------------------------------------------------------------------
// Expressions
// ----------------------------------------------------------------------------

// NilLit is the nil literal.
type NilLit struct{ Pos Pos }

func (e *NilLit) nodePos() Pos { return e.Pos }
func (e *NilLit) exprNode()    {}

// TrueLit is the true literal.
type TrueLit struct{ Pos Pos }

func (e *TrueLit) nodePos() Pos { return e.Pos }
func (e *TrueLit) exprNode()    {}

// FalseLit is the false literal.
type FalseLit struct{ Pos Pos }

func (e *FalseLit) nodePos() Pos { return e.Pos }
func (e *FalseLit) exprNode()    {}

// NumberLit holds the parsed numeric value and its raw source text.
type NumberLit struct {
	Pos   Pos
	Value float64
	Raw   string
}

func (e *NumberLit) nodePos() Pos { return e.Pos }
func (e *NumberLit) exprNode()    {}

// StringLit holds the decoded string value and its raw source text.
// Raw is the entire source representation including delimiters (useful for
// source-map tracking and string-extraction passes).
type StringLit struct {
	Pos   Pos
	Value string // Decoded bytes
	Raw   string // Source text as it appeared (delimiters included)
}

func (e *StringLit) nodePos() Pos { return e.Pos }
func (e *StringLit) exprNode()    {}

// VarArgExpr is the ... expression inside a vararg function.
type VarArgExpr struct{ Pos Pos }

func (e *VarArgExpr) nodePos() Pos { return e.Pos }
func (e *VarArgExpr) exprNode()    {}

// NameExpr is a simple identifier reference.
type NameExpr struct {
	Pos  Pos
	Name string
}

func (e *NameExpr) nodePos() Pos { return e.Pos }
func (e *NameExpr) exprNode()    {}

// IndexExpr is table[key].
type IndexExpr struct {
	Pos   Pos
	Table Expr
	Key   Expr
}

func (e *IndexExpr) nodePos() Pos { return e.Pos }
func (e *IndexExpr) exprNode()    {}

// FieldExpr is table.field (sugar for table["field"]).
type FieldExpr struct {
	Pos   Pos
	Table Expr
	Field string
}

func (e *FieldExpr) nodePos() Pos { return e.Pos }
func (e *FieldExpr) exprNode()    {}

// MethodExpr is table:method (used in method call syntax).
type MethodExpr struct {
	Pos    Pos
	Object Expr
	Method string
}

func (e *MethodExpr) nodePos() Pos { return e.Pos }
func (e *MethodExpr) exprNode()    {}

// BinaryExpr is left op right.
type BinaryExpr struct {
	Pos   Pos
	Op    string
	Left  Expr
	Right Expr
}

func (e *BinaryExpr) nodePos() Pos { return e.Pos }
func (e *BinaryExpr) exprNode()    {}

// UnaryExpr is op operand.
type UnaryExpr struct {
	Pos     Pos
	Op      string
	Operand Expr
}

func (e *UnaryExpr) nodePos() Pos { return e.Pos }
func (e *UnaryExpr) exprNode()    {}

// CallExpr is func(args).
type CallExpr struct {
	Pos  Pos
	Func Expr
	Args []Expr
}

func (e *CallExpr) nodePos() Pos { return e.Pos }
func (e *CallExpr) exprNode()    {}

// MethodCallExpr is object:method(args).
type MethodCallExpr struct {
	Pos    Pos
	Object Expr
	Method string
	Args   []Expr
}

func (e *MethodCallExpr) nodePos() Pos { return e.Pos }
func (e *MethodCallExpr) exprNode()    {}

// FuncExpr is an anonymous function expression (function(params) body end).
type FuncExpr struct {
	Pos      Pos
	Params   []string
	HasVarArg bool
	Body     *Block
}

func (e *FuncExpr) nodePos() Pos { return e.Pos }
func (e *FuncExpr) exprNode()    {}

// TableConstructor is a table literal {fields}.
type TableConstructor struct {
	Pos    Pos
	Fields []TableField
}

func (e *TableConstructor) nodePos() Pos { return e.Pos }
func (e *TableConstructor) exprNode()    {}

// TableField represents one entry in a table constructor.
// Three forms:
//   [expr] = expr  → Key != nil, Name == ""
//   name = expr    → Key == nil, Name != ""
//   expr           → Key == nil, Name == ""
type TableField struct {
	Pos   Pos
	Key   Expr   // bracketed key, or nil
	Name  string // identifier key, or ""
	Value Expr
}

// ----------------------------------------------------------------------------
// Chunk (top-level)
// ----------------------------------------------------------------------------

// Chunk is the top-level AST node representing an entire Lua source file.
type Chunk struct {
	Pos  Pos
	Body *Block
}

func (c *Chunk) nodePos() Pos { return c.Pos }

// ----------------------------------------------------------------------------
// String extraction visitor
// ----------------------------------------------------------------------------

// StringCollector traverses an AST and collects all StringLit nodes.
type StringCollector struct {
	Strings []*StringLit
}

// CollectStrings walks the given node and appends all string literals found.
func (sc *StringCollector) CollectStrings(n Node) {
	sc.walk(n)
}

func (sc *StringCollector) walk(n Node) {
	if n == nil {
		return
	}
	switch v := n.(type) {
	case *Chunk:
		sc.walk(v.Body)
	case *Block:
		for _, s := range v.Stmts {
			sc.walk(s)
		}
	case *AssignStmt:
		for _, t := range v.Targets {
			sc.walk(t)
		}
		for _, e := range v.Values {
			sc.walk(e)
		}
	case *LocalAssignStmt:
		for _, e := range v.Values {
			sc.walk(e)
		}
	case *FuncCallStmt:
		sc.walk(v.Call)
	case *DoStmt:
		sc.walk(v.Body)
	case *WhileStmt:
		sc.walk(v.Cond)
		sc.walk(v.Body)
	case *RepeatStmt:
		sc.walk(v.Body)
		sc.walk(v.Cond)
	case *IfStmt:
		sc.walk(v.Cond)
		sc.walk(v.Then)
		for _, ei := range v.ElseIfs {
			sc.walk(ei.Cond)
			sc.walk(ei.Body)
		}
		if v.Else != nil {
			sc.walk(v.Else)
		}
	case *ForNumStmt:
		sc.walk(v.Start)
		sc.walk(v.Limit)
		if v.Step != nil {
			sc.walk(v.Step)
		}
		sc.walk(v.Body)
	case *ForGenericStmt:
		for _, it := range v.Iters {
			sc.walk(it)
		}
		sc.walk(v.Body)
	case *FuncDefStmt:
		sc.walk(v.Func)
	case *LocalFuncDefStmt:
		sc.walk(v.Func)
	case *ReturnStmt:
		for _, e := range v.Values {
			sc.walk(e)
		}
	case *BreakStmt:
		// leaf
	case *StringLit:
		sc.Strings = append(sc.Strings, v)
	case *NilLit, *TrueLit, *FalseLit, *NumberLit, *VarArgExpr, *NameExpr:
		// leaves — no strings here
	case *IndexExpr:
		sc.walk(v.Table)
		sc.walk(v.Key)
	case *FieldExpr:
		sc.walk(v.Table)
	case *MethodExpr:
		sc.walk(v.Object)
	case *BinaryExpr:
		sc.walk(v.Left)
		sc.walk(v.Right)
	case *UnaryExpr:
		sc.walk(v.Operand)
	case *CallExpr:
		sc.walk(v.Func)
		for _, a := range v.Args {
			sc.walk(a)
		}
	case *MethodCallExpr:
		sc.walk(v.Object)
		for _, a := range v.Args {
			sc.walk(a)
		}
	case *FuncExpr:
		sc.walk(v.Body)
	case *TableConstructor:
		for _, f := range v.Fields {
			if f.Key != nil {
				sc.walk(f.Key)
			}
			sc.walk(f.Value)
		}
	}
}

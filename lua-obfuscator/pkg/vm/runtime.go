// Package vm implements the runtime execution engine for obfuscated bytecode.
package vm

import (
	"fmt"
	"math"
)

// Value represents a Lua value in the VM.
type Value struct {
	Type  ValueType
	Data  interface{}
}

type ValueType byte

const (
	TypeNil ValueType = iota
	TypeBool
	TypeNumber
	TypeString
	TypeTable
	TypeFunction
)

// VM is the virtual machine state.
type VM struct {
	Config     *VMConfig
	Code       []byte         // Bytecode stream
	Constants  []Value        // Constant pool (encrypted)
	Globals    map[string]Value
	Stack      []Value        // Execution stack
	PC         int            // Program counter
	Registers  [256]Value     // Register file
	CallStack  []CallFrame    // Call stack
}

type CallFrame struct {
	ReturnPC int
	BaseReg  byte
}

// NewVM creates a new VM instance with the given config and bytecode.
func NewVM(cfg *VMConfig, code []byte, constants []Value) *VM {
	return &VM{
		Config:    cfg,
		Code:      code,
		Constants: decryptConstants(constants, cfg.ConstKey),
		Globals:   make(map[string]Value),
		Stack:     make([]Value, 0, 256),
		Registers: [256]Value{},
		CallStack: make([]CallFrame, 0, 64),
		PC:        0,
	}
}

// Run executes the bytecode until completion or error.
func (vm *VM) Run() error {
	for vm.PC < len(vm.Code) {
		if vm.PC+6 > len(vm.Code) {
			return fmt.Errorf("incomplete instruction at PC=%d", vm.PC)
		}

		instr := DecodeInstruction(vm.Code[vm.PC:vm.PC+6], vm.Config)
		vm.PC += 6

		if err := vm.execute(instr); err != nil {
			return fmt.Errorf("runtime error at PC=%d: %w", vm.PC-6, err)
		}
	}
	return nil
}

// execute dispatches a single instruction.
func (vm *VM) execute(instr *Instruction) error {
	switch instr.Op {
	case OP_NOP:
		// Do nothing
		
	case OP_LOADK:
		// R(A) = Constants[B]
		if int(instr.B) >= len(vm.Constants) {
			return fmt.Errorf("constant index %d out of bounds", instr.B)
		}
		vm.Registers[instr.A] = vm.Constants[instr.B]

	case OP_LOADBOOL:
		// R(A) = (B != 0); if C then PC++
		vm.Registers[instr.A] = Value{Type: TypeBool, Data: instr.B != 0}
		if instr.C != 0 {
			vm.PC += 6
		}

	case OP_LOADNIL:
		// R(A) ... R(A+B) = nil
		for i := instr.A; i <= instr.A+byte(instr.B); i++ {
			vm.Registers[i] = Value{Type: TypeNil}
		}

	case OP_ADD:
		// R(A) = R(B) + R(C)
		left := vm.Registers[byte(instr.B)]
		right := vm.Registers[byte(instr.C)]
		if left.Type != TypeNumber || right.Type != TypeNumber {
			return fmt.Errorf("attempt to add non-numbers")
		}
		vm.Registers[instr.A] = Value{
			Type: TypeNumber,
			Data: left.Data.(float64) + right.Data.(float64),
		}

	case OP_SUB:
		left := vm.Registers[byte(instr.B)]
		right := vm.Registers[byte(instr.C)]
		if left.Type != TypeNumber || right.Type != TypeNumber {
			return fmt.Errorf("attempt to subtract non-numbers")
		}
		vm.Registers[instr.A] = Value{
			Type: TypeNumber,
			Data: left.Data.(float64) - right.Data.(float64),
		}

	case OP_MUL:
		left := vm.Registers[byte(instr.B)]
		right := vm.Registers[byte(instr.C)]
		if left.Type != TypeNumber || right.Type != TypeNumber {
			return fmt.Errorf("attempt to multiply non-numbers")
		}
		vm.Registers[instr.A] = Value{
			Type: TypeNumber,
			Data: left.Data.(float64) * right.Data.(float64),
		}

	case OP_DIV:
		left := vm.Registers[byte(instr.B)]
		right := vm.Registers[byte(instr.C)]
		if left.Type != TypeNumber || right.Type != TypeNumber {
			return fmt.Errorf("attempt to divide non-numbers")
		}
		if right.Data.(float64) == 0 {
			return fmt.Errorf("division by zero")
		}
		vm.Registers[instr.A] = Value{
			Type: TypeNumber,
			Data: left.Data.(float64) / right.Data.(float64),
		}

	case OP_POW:
		left := vm.Registers[byte(instr.B)]
		right := vm.Registers[byte(instr.C)]
		if left.Type != TypeNumber || right.Type != TypeNumber {
			return fmt.Errorf("attempt to exponentiate non-numbers")
		}
		vm.Registers[instr.A] = Value{
			Type: TypeNumber,
			Data: math.Pow(left.Data.(float64), right.Data.(float64)),
		}

	case OP_JMP:
		// PC += signed offset in B
		offset := int(int16(instr.B)) * 6
		vm.PC += offset

	case OP_RETURN:
		// Return from function
		if len(vm.CallStack) == 0 {
			return nil // Program exit
		}
		frame := vm.CallStack[len(vm.CallStack)-1]
		vm.CallStack = vm.CallStack[:len(vm.CallStack)-1]
		vm.PC = frame.ReturnPC

	default:
		return fmt.Errorf("unimplemented opcode: %v", instr.Op)
	}

	return nil
}

// decryptConstants decrypts the constant pool using XOR with the key.
func decryptConstants(encrypted []Value, key uint64) []Value {
	decrypted := make([]Value, len(encrypted))
	for i, val := range encrypted {
		if val.Type == TypeString {
			str := val.Data.(string)
			decrypted[i] = Value{
				Type: TypeString,
				Data: xorString(str, key^uint64(i)),
			}
		} else {
			decrypted[i] = val
		}
	}
	return decrypted
}

// xorString applies XOR encryption to a string.
func xorString(s string, key uint64) string {
	result := make([]byte, len(s))
	keyBytes := []byte{
		byte(key), byte(key >> 8), byte(key >> 16), byte(key >> 24),
		byte(key >> 32), byte(key >> 40), byte(key >> 48), byte(key >> 56),
	}
	for i := 0; i < len(s); i++ {
		result[i] = s[i] ^ keyBytes[i%8]
	}
	return string(result)
}

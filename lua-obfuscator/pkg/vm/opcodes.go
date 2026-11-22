// Package vm implements a custom bytecode virtual machine for obfuscated Lua.
// Opcodes are randomized per compilation to resist pattern matching.
package vm

import (
	"crypto/rand"
	"encoding/binary"
	"fmt"
)

// OpCode represents a VM instruction. The actual numeric values are randomized.
type OpCode byte

// Instruction set (logical opcodes - mapped to random bytes at compile time)
const (
	OP_NOP OpCode = iota
	OP_LOADK           // Load constant to register
	OP_LOADBOOL        // Load boolean
	OP_LOADNIL         // Load nil
	OP_GETGLOBAL       // Get global variable
	OP_SETGLOBAL       // Set global variable
	OP_GETUPVAL        // Get upvalue
	OP_SETUPVAL        // Set upvalue
	OP_GETTABLE        // Get table[key]
	OP_SETTABLE        // Set table[key] = value
	OP_NEWTABLE        // Create new table
	OP_SELF            // Prepare method call
	OP_ADD             // Addition
	OP_SUB             // Subtraction
	OP_MUL             // Multiplication
	OP_DIV             // Division
	OP_MOD             // Modulo
	OP_POW             // Power
	OP_UNM             // Unary minus
	OP_NOT             // Logical NOT
	OP_LEN             // Length operator
	OP_CONCAT          // String concatenation
	OP_JMP             // Unconditional jump
	OP_EQ              // Equality test
	OP_LT              // Less than
	OP_LE              // Less or equal
	OP_TEST            // Boolean test
	OP_TESTSET         // Test and set
	OP_CALL            // Function call
	OP_TAILCALL        // Tail call
	OP_RETURN          // Return from function
	OP_FORLOOP         // Numeric for loop iteration
	OP_FORPREP         // Numeric for loop preparation
	OP_TFORLOOP        // Generic for loop iteration
	OP_SETLIST         // Set array elements
	OP_CLOSE           // Close upvalues
	OP_CLOSURE         // Create closure
	OP_VARARG          // Handle varargs
)

// VMConfig holds the randomized opcode mapping for a single compilation.
type VMConfig struct {
	// Mapping from logical opcode to actual byte value
	OpcodeMap map[OpCode]byte
	// Reverse mapping for runtime dispatch
	ReverseMap map[byte]OpCode
	// Constant pool encryption key
	ConstKey uint64
	// Jump table seed for control flow obfuscation
	JumpSeed uint32
}

// NewVMConfig generates a fresh VM configuration with randomized opcodes.
func NewVMConfig() (*VMConfig, error) {
	cfg := &VMConfig{
		OpcodeMap:  make(map[OpCode]byte),
		ReverseMap: make(map[byte]OpCode),
	}

	// Generate random constant encryption key
	var keyBytes [8]byte
	if _, err := rand.Read(keyBytes[:]); err != nil {
		return nil, fmt.Errorf("failed to generate const key: %w", err)
	}
	cfg.ConstKey = binary.LittleEndian.Uint64(keyBytes[:])

	// Generate random jump seed
	var seedBytes [4]byte
	if _, err := rand.Read(seedBytes[:]); err != nil {
		return nil, fmt.Errorf("failed to generate jump seed: %w", err)
	}
	cfg.JumpSeed = binary.LittleEndian.Uint32(seedBytes[:])

	// Create shuffled byte array [0..255]
	usedBytes := make([]byte, 256)
	for i := range usedBytes {
		usedBytes[i] = byte(i)
	}
	
	// Fisher-Yates shuffle
	randBytes := make([]byte, 256)
	if _, err := rand.Read(randBytes); err != nil {
		return nil, fmt.Errorf("failed to shuffle opcodes: %w", err)
	}
	
	for i := 255; i > 0; i-- {
		j := int(randBytes[i]) % (i + 1)
		usedBytes[i], usedBytes[j] = usedBytes[j], usedBytes[i]
	}

	// Map logical opcodes to random bytes
	opcodes := []OpCode{
		OP_NOP, OP_LOADK, OP_LOADBOOL, OP_LOADNIL,
		OP_GETGLOBAL, OP_SETGLOBAL, OP_GETUPVAL, OP_SETUPVAL,
		OP_GETTABLE, OP_SETTABLE, OP_NEWTABLE, OP_SELF,
		OP_ADD, OP_SUB, OP_MUL, OP_DIV, OP_MOD, OP_POW,
		OP_UNM, OP_NOT, OP_LEN, OP_CONCAT,
		OP_JMP, OP_EQ, OP_LT, OP_LE,
		OP_TEST, OP_TESTSET,
		OP_CALL, OP_TAILCALL, OP_RETURN,
		OP_FORLOOP, OP_FORPREP, OP_TFORLOOP,
		OP_SETLIST, OP_CLOSE, OP_CLOSURE, OP_VARARG,
	}

	for i, op := range opcodes {
		randomByte := usedBytes[i]
		cfg.OpcodeMap[op] = randomByte
		cfg.ReverseMap[randomByte] = op
	}

	return cfg, nil
}

// Encode converts a logical opcode to its randomized byte.
func (cfg *VMConfig) Encode(op OpCode) byte {
	return cfg.OpcodeMap[op]
}

// Decode converts a randomized byte back to logical opcode.
func (cfg *VMConfig) Decode(b byte) OpCode {
	return cfg.ReverseMap[b]
}

// Instruction represents a single VM instruction with 3 operands.
// Layout: [opcode:1][A:1][B:2][C:2] = 6 bytes per instruction
type Instruction struct {
	Op OpCode
	A  byte   // Primary register/target
	B  uint16 // Second operand (register or constant index)
	C  uint16 // Third operand
}

// Encode serializes an instruction to 6 bytes using the VM config.
func (i *Instruction) Encode(cfg *VMConfig) []byte {
	buf := make([]byte, 6)
	buf[0] = cfg.Encode(i.Op)
	buf[1] = i.A
	binary.LittleEndian.PutUint16(buf[2:4], i.B)
	binary.LittleEndian.PutUint16(buf[4:6], i.C)
	return buf
}

// DecodeInstruction deserializes 6 bytes to an instruction.
func DecodeInstruction(data []byte, cfg *VMConfig) *Instruction {
	if len(data) < 6 {
		return nil
	}
	return &Instruction{
		Op: cfg.Decode(data[0]),
		A:  data[1],
		B:  binary.LittleEndian.Uint16(data[2:4]),
		C:  binary.LittleEndian.Uint16(data[4:6]),
	}
}

// String returns a human-readable representation (for debugging only).
func (i *Instruction) String() string {
	return fmt.Sprintf("%v A=%d B=%d C=%d", i.Op, i.A, i.B, i.C)
}

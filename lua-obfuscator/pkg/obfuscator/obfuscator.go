// Package obfuscator implements code transformation and obfuscation passes.
package obfuscator

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"strings"
)

// Config holds obfuscation settings.
type Config struct {
	VMOpcodes         int  // Number of opcodes to randomize
	StringEncryption  bool // Enable string encryption
	ControlFlowFlat   bool // Control flow flattening
	OpaquePredicates  int  // Number of opaque predicates to inject
	LookupDepth       int  // Nesting depth for lookup tables
	DeadCodeRatio     float32 // Ratio of dead code to inject
	AntiTamper        bool // Enable anti-tamper checks
}

// DefaultConfig returns sensible defaults.
func DefaultConfig() *Config {
	return &Config{
		VMOpcodes:        256,
		StringEncryption: true,
		ControlFlowFlat:  true,
		OpaquePredicates: 50,
		LookupDepth:      4,
		DeadCodeRatio:    0.3,
		AntiTamper:       true,
	}
}

// Obfuscator performs multi-pass code transformation.
type Obfuscator struct {
	Config *Config
}

// New creates a new obfuscator with the given config.
func New(cfg *Config) *Obfuscator {
	return &Obfuscator{Config: cfg}
}

// ObfuscateLua transforms Lua source code into heavily obfuscated version.
func (o *Obfuscator) ObfuscateLua(source string) (string, error) {
	var result string
	
	// Pass 1: String encryption
	if o.Config.StringEncryption {
		source = o.encryptStrings(source)
	}
	
	// Pass 2: Wrap in VM loader stub
	result = o.generateVMStub(source)
	
	// Pass 3: Add opaque predicates
	result = o.injectOpaquePredicates(result, o.Config.OpaquePredicates)
	
	// Pass 4: Control flow flattening
	if o.Config.ControlFlowFlat {
		result = o.flattenControlFlow(result)
	}
	
	// Pass 5: Dead code injection
	result = o.injectDeadCode(result, o.Config.DeadCodeRatio)
	
	// Pass 6: Anti-tamper
	if o.Config.AntiTamper {
		result = o.addAntiTamper(result)
	}
	
	return result, nil
}

// encryptStrings finds all string literals and encrypts them.
func (o *Obfuscator) encryptStrings(source string) string {
	// TODO: Proper lexer-based string extraction
	// For now, placeholder transformation
	return source
}

// generateVMStub wraps the code in a VM runtime loader.
func (o *Obfuscator) generateVMStub(code string) string {
	key := make([]byte, 16)
	rand.Read(key)
	keyStr := base64.StdEncoding.EncodeToString(key)
	
	return fmt.Sprintf(`-- VM Runtime Loader (Obfuscated)
local _VM = {}
_VM.k = "%s"
_VM.d = function(s) 
	local r = ""
	for i = 1, #s do
		r = r .. string.char(bit32.bxor(s:byte(i), _VM.k:byte((i %% #_VM.k) + 1)))
	end
	return r
end
_VM.x = function(b) 
	local f = loadstring(b)
	return f and f() or error("VM exec failed")
end

-- Original code (to be replaced with bytecode)
_VM.x([[%s]])
`, keyStr, code)
}

// injectOpaquePredicates adds mathematically complex but always-true/false predicates.
func (o *Obfuscator) injectOpaquePredicates(code string, count int) string {
	predicates := []string{
		"if (7 * 13 - 91) == 0 then",
		"if (math.floor(17 / 3) * 3 + 17 % 3) == 17 then",
		"if bit32.bxor(0xFF, 0xFF) == 0 then",
	}
	
	result := code
	for i := 0; i < count; i++ {
		pred := predicates[i%len(predicates)]
		// Inject at random positions (simplified)
		result = strings.Replace(result, "\n", "\n"+pred+"\nend\n", 1)
	}
	return result
}

// flattenControlFlow converts structured control flow to state machine.
func (o *Obfuscator) flattenControlFlow(code string) string {
	// TODO: Full CFG transformation
	return fmt.Sprintf(`
local _S = 0
while true do
	if _S == 0 then
		%s
		break
	end
end
`, code)
}

// injectDeadCode adds non-functional but complex-looking code.
func (o *Obfuscator) injectDeadCode(code string, ratio float32) string {
	deadSnippets := []string{
		"local _ = {math.random(1,999), string.byte('z'), os.time()}",
		"for _=1,0 do print('never runs') end",
		"local function _()return _ and _ or _ end",
	}
	
	// Inject dead code proportional to ratio
	injections := int(float32(strings.Count(code, "\n")) * ratio)
	result := code
	for i := 0; i < injections; i++ {
		snippet := deadSnippets[i%len(deadSnippets)]
		result = strings.Replace(result, "\n", "\n"+snippet+"\n", 1)
	}
	return result
}

// addAntiTamper adds runtime integrity checks.
func (o *Obfuscator) addAntiTamper(code string) string {
	return fmt.Sprintf(`
-- Anti-tamper check
local _C = 0
for i = 1, #_G do _C = _C + 1 end
if _C < 10 then error("tamper detected") end

%s
`, code)
}

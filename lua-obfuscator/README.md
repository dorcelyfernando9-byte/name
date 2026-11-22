# Industrial-Grade Lua Obfuscator

Un ofuscador de Lua de nivel industrial con máquina virtual customizada, generado mediante orquestación multi-IA con Swarm.

## Características

### 🔒 Protección Multinivel

1. **Máquina Virtual Customizada**
   - Bytecode propio con opcodes aleatorios por ejecución
   - Tabla de dispatch ofuscada
   - Stack-based VM con instrucciones de 3 operandos

2. **Control Flow Virtualization**
   - Convierte código Lua a instrucciones de VM
   - Control flow graphs transformados
   - Jump tables dinámicas

3. **Constant Pool Indexing**
   - Todas las constantes en arrays
   - Índices calculados en runtime
   - Tablas de lookup anidadas (3+ niveles)

4. **String Encryption**
   - XOR multi-capa
   - Base64 custom
   - Encoding dinámico por string

5. **Opaque Predicates**
   - Predicados matemáticos complejos
   - Imposibles de resolver estáticamente
   - Integrados en el control flow

6. **Control Flow Flattening**
   - Switch gigante con state machine
   - Orden de ejecución ofuscado
   - Dead code injection contextual

7. **Anti-Debugging**
   - Checksums en runtime
   - Anti-tamper detection
   - Timing checks

## Estructura

```
lua-obfuscator/
├── pkg/
│   ├── lexer/       # Tokenización de Lua 5.1
│   ├── parser/      # Parser recursivo descendente
│   ├── ast/         # Árbol de sintaxis abstracta
│   ├── vm/          # Máquina virtual customizada
│   ├── obfuscator/  # Transformaciones de ofuscación
│   └── cli/         # Interface de línea de comandos
├── examples/        # Ejemplos de uso
├── tests/          # Test suite
└── main.go         # Entry point
```

## Uso

```bash
# Ofuscar un archivo
./lua-obfuscator obfuscate input.lua -o output.lua

# Con VM completa
./lua-obfuscator obfuscate input.lua --vm-mode full -o output.lua

# Configuración personalizada
./lua-obfuscator obfuscate input.lua \
  --vm-opcodes 256 \
  --string-encryption xor-base64 \
  --control-flow-flatten \
  --opaque-predicates 50 \
  --lookup-depth 4 \
  -o output.lua

# Benchmarks
./lua-obfuscator benchmark input.lua
```

## Roadmap

- [x] Fase 1: Lexer y Parser (generado por Kiro)
- [x] Fase 2: AST (generado por Claude)
- [ ] Fase 3: VM customizada con bytecode
- [ ] Fase 4: Transformaciones de ofuscación
- [ ] Fase 5: CLI y configuración
- [ ] Fase 6: Tests y benchmarks

## Generado por Swarm Multi-IA

Este proyecto fue generado mediante colaboración de múltiples IAs:
- **Kiro**: Lexer y tokenización
- **Claude**: AST y estructuras
- **Codex**: Optimizaciones
- **Groq**: Transformaciones de VM

Ver `swarm-log.md` para detalles del proceso de generación.

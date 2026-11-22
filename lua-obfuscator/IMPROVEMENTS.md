# Mejoras Necesarias para el Ofuscador

## CRÍTICO - Falta Implementar

### 1. Parser Completo de Lua
- [ ] Lexer debe extraer TODOS los tokens (strings, números, keywords)
- [ ] Parser recursivo descendente completo siguiendo gramática Lua 5.1
- [ ] Construcción de AST completo y correcto
- [ ] Manejo de todos los casos edge (multiline strings, comments, etc)

### 2. VM Bytecode Compiler
- [ ] Compilador de AST → Bytecode customizado
- [ ] Generación de constant pool
- [ ] Register allocation inteligente
- [ ] Jump resolution y backpatching

### 3. String Encryption Avanzada
- [ ] Extraer TODOS los string literals del AST
- [ ] Múltiples capas: XOR + Base64 + custom encoding
- [ ] Diferentes keys por string
- [ ] Lookup tables para desencriptar
- [ ] Strings divididos en chunks

### 4. Control Flow Virtualization COMPLETA
- [ ] Convertir funciones a bytecode de VM
- [ ] Tabla de dispatch ofuscada con jumps indirectos
- [ ] State machine con switch gigante
- [ ] Basic blocks con IDs aleatorios

### 5. Constant Array Indexing
- [ ] TODAS las constantes en arrays multi-dimensionales
- [ ] Índices calculados con expresiones matemáticas complejas
- [ ] Lookup tables anidados (3-5 niveles)
- [ ] Acceso indirecto vía funciones

### 6. Opaque Predicates Matemáticos
- [ ] Predicados basados en teoría de números (primos, factoriales)
- [ ] Predicados polinomiales imposibles de resolver
- [ ] Integrados en el control flow real
- [ ] Variables dummy que afectan predicados

### 7. Dead Code Injection Inteligente
- [ ] Código que PARECE funcional pero nunca ejecuta
- [ ] Funciones dummy que se referencian
- [ ] Variables que se leen pero nunca usan
- [ ] Loops que parecen infinitos pero no lo son

### 8. Anti-Debug y Anti-Tamper
- [ ] Checksums de bytecode en runtime
- [ ] Timing checks para detectar debugging
- [ ] Environment checks (verificar _G, debug, etc)
- [ ] Self-modifying code

### 9. Lookup Tables Complejas
- [ ] Arrays multi-dimensionales [][][]...
- [ ] Acceso calculado: arr[x*37+y%13][z^5]
- [ ] Tablas que se construyen en runtime
- [ ] Mezcla de constantes reales y dummies

### 10. Performance
- [ ] Benchmarks de velocidad obfuscado vs original
- [ ] Optimizar VM interpreter (hot paths)
- [ ] Reducir overhead de desencriptación
- [ ] Cache de lookups frecuentes

## EXTRA - Features Avanzadas

- [ ] Metamethods customizados para ofuscar operadores
- [ ] FFI obfuscation (si usa LuaJIT)
- [ ] Fake error messages que confunden
- [ ] Multiple VM layers (VM dentro de VM)
- [ ] Code splitting (dividir en módulos cargados dinámicamente)
- [ ] Watermarking (marca única por compilación)

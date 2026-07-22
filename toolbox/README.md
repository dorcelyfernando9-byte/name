# Proyecto Toolbox - Motor de Desarrollo

Este es un motor de desarrollo completo y Toolbox de alto rendimiento diseñado para crear aplicaciones profesionales de Discord bots y frameworks web.

## 🏗️ Arquitectura

### Estructura de Directorios

```
toolbox/
├── packages/
│   ├── core/                    # Lógica central del Toolbox
│   │   ├── src/                # Código fuente TypeScript
│   │   └── dist/               # Código compilado JavaScript
│   └── cli/                    # Interfaz de línea de comandos
│       ├── src/                # CLI TypeScript
│       └── dist/               # binario compilado
├── core/                        # Módulos TypeScript principales (alias @toolbox/core)
├── generators/                  # Plantillas para diferentes tipos de proyectos
└── languages/                  # Puentes para múltiples lenguajes

```

### Arquitectura de Módulos

El Toolbox está organizado en módulos especializados:

- **Eventos**: EventBus, BindableEvent, RemoteEvent
- **Herramientas**: Cifrado, Obfuscar, Colores, APIs, QR Codes
- **Red**: Comunicaciones, Servicios HTTP, WebSockets
- **Tiempo de Ejecución**: Planificador de Tareas, Colas, Pipeline
- **Seguridad**: Secrets Manager, Auth, Validación
- **Plantillas**: TemplateEngine, Generadores de Proyectos
- **Herramientas**: Compiler, SyntaxParser, Lenguajes Bridge

## 🚀 Características Principales

### CLI Multi-implementación
```bash
# Plantillas de proyectos preconstruidas
toolbox new discord-bot myBot
toolbox new api myApi
toolbox new web mySite
toolbox new cli myCli
toolbox new library myLib

# Potentes herramientas de desarrollo
toolbox run "get user.profile"
toolbox encrypt data.json
toolbox obfuscate ./src
toolbox api start --port 3000
toolbox event listener add "message"
toolbox plugin install ui-components

# Construir para cualquier plataforma
toolbox build --target node
toolbox build --target exe
toolbox build --target python
toolbox build --target wasm
```

### Sistema de Plantillas de Proyecto

Automatiza la creación instantánea de proyectos profesionales:

- **discord-bot**: Plantilla lista para producción con Client de Discord.js preconfigurado
- **api**: Servidor Fastify/Express con scaffold de almacenamiento
- **web**: Skeleton de Express/Koa + tipo MVC
- **cli**: Programa de Command-line moderno con commander.js
- **library**: Ligeramente tipado, con build rollup-ready

### Motor de Cifrado/Ofuscación

El Toolbox incluye implementaciones criptonativas:

- **Cifrado AES-GCM/RSA/Nyquist** con llaves escalables
- **Ofuscación multi-nivel** (Light→Extreme) con invertir de bits, rebanado, relleno
- **Pipeline de pipeline** con middlewares y filtros
- **Verificación de integridad** SHA-512 + firmas RSA

### Sistema de Evento-Unificado

Sistema dúplex orientado a eventos:

- **Eventos locales**: EventBus con middleware, orden de prioridad
- **Eventos remotos**: Comunicaciones cliente-servidor bi-direccionales
- **Eventos asíncronos**: `emit()` + `wait()` sincronizado con timeout
- **Filtros**: Filtrado per-conexión por expresión regular

### Multi-lenguaje y Multi-plataforma

Compilar una vez, desplegar en cualquier lugar:

- **HTML5/WASM**: Ejecutar en navegador
- **Binario nativo**: Native Node/Python/Go/Rust/C/C++
- **Librerías compartilhadas**: .so/.dll/.dylib globales
- **Puentes DSL**: Ejecutar código Toolbox en 5 lenguajes

## 📦 Configuración del Proyecto

### `package.json` raíz

```json
{
  "name": "toolbox-workspace",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "npm run build -w @toolbox/core && npm run build -w @toolbox/cli",
    "build:core": "npm run build:protected -w @toolbox/core",
    "build:cli": "npm run build -w @toolbox/cli",
    "test": "node packages/core/dist/test/tests.js",
    "docs": "typedoc"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.11.0",
    "typedoc": "latest"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### `tsconfig.json` raíz

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./"
  },
  "include": ["src/**/*", "packages/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 🛠️ Guía de Desarrollo

### Instalación y Construcción

```bash
# Una sola vez - instalar dependencias
npm install

# Construir todo (nodejs >= 18)
npm run build

# Ejecutar tests unitarios
npm test

# Servir ejemplo de documentación
npm i -g http-server
cd dist && http-server --port 8080
```

### Construir un Proyecto Individual

```bash
# Construir el núcleo del Toolbox
cd packages/core && npm run build

# Construir el CLI
cd packages/cli && npm run build

# Construir el núcleo del Toolbox con análisis estático (protegido)
cd packages/core && npm run build:protected
```

### Administración de Dependencias

El Toolbox utiliza un enfoque moderno de manejadores de paquetes:

- **npm workspaces** para monorepo sincronizado
- **Installed copies** en carpetas 'packages/*'
- **Aliases escasos** TypeScript (@toolbox/core, @toolbox/cli)
- **No es necesario node_modules en raíz** para menor desorden

## 📚 Documentación para Desarrolladores

### Consumo del API

```typescript
import { toolbox } from "@toolbox/core";
import { logger } from "@toolbox/core";

// Configuración del motor
toolbox.config.set("app.name", "Mi Bot Discord");
toolbox.config.set("discord.token", process.env.DISCORD_TOKEN);

// Eventos
toolbox.events.on("message", (data) => {
  logger.info(`Mensaje recibido: ${data.text}`);
});

// Cifrado
const crypto = new CryptoEngineAdvanced("mi-clave-maestra");
const encrypted = crypto.encrypt("datos sensibles");

// Colores (útil para Discord embed-rich)
const color = Color.named("discord-blurple");
const embedColor = color.toDiscord();  // → 5793807

// Ejecutar una plantilla
toolbox.templates.render("¡Hola {{user.name}}!", { user: { name: "Alex" } });
```

### CLI y Automatización

```bash
# Cifrar un archivo con pipeline con llave
toolbox encrypt --input "config.json" --output "config.enc.json" --key "mi-clave"

# Ejecutar una plantilla desde un string
toolbox run "template render greeting {{user.name}}"

# Obtener/establecer valores del Toolbox (¿DSL?)
toolbox config get app.version
toolbox config set app.version "2.0.0"

# Administración de plugins
toolbox plugin list
toolbox plugin install ui-components
toolbox plugin enable ui-components

# Base de datos / almacenamiento
toolbox storage init --driver nsql
toolbox storage set user:123 "{\"level\":5}" --encrypt
toolbox storage get user:123
toolbox storage query "SELECT * FROM users WHERE active = 1"
```

### Estructura del Proyecto y Patrones

```typescript
// ==============================================================================
// Arquitectura del Proyecto Discord Bot
// ==============================================================================

// src/
├── bot.ts                          # Archivo de bootstrap del bot
├── events/
│   ├── ready.ts                   # Fuegos artificiales de eventos
│   ├── message.ts                 # Detector de spam + filtrado de palabras
│   └── interaction.ts             # Manejador de comandos Slash
├── plugins/
│   ├── music.ts                   # Función de reproductor de música
│   └── economy.ts                 # Bot economía/puntos
├── database.ts                     # Conexión SQLite / PostgreSQL
├── config.json                     # Configuración por entorno
└── package.json                    # Dependencias del nodo del proyecto

// 🏗️ Patrones del motor Toolbox

// 1. Evento del motor de pipeline
events.on("database:query", (result) => {
  analytics.track("db:query", {
    query: result.query,
    rowsAffected: result.rowsAffected
  });
});

// 2. Cifrado en cada capa
dbService.setEncryptionKey(process.env.DB_KEY);

// 3. Sistema de colores consistente
embed.setColor(Color.named("discord-blurple"));

// 4. Ofuscación asíncrona para archivos source
sourceWatcher.on("change", async (path) => {
  await obfuscateFile(path, { level: "medium" });
});
```

## 🔧 Construcción Potente

### Compilar para Consumo del Consumidor

El Toolbox puede producir binarios para los siguientes públicos objetivo:

- **Node.js**: `toolbox build --target node` → `dist/toolbox-node.js`
- **Nativo**: `toolbox build --target exe` → `dist/toolbox.exe`
- **Web**: `toolbox build --target wasm` → `dist/toolbox.html`
- **Python**: `toolbox build --target python` → `dist/toolbox.pyz`

### Empaquetado y Empaquetar

Los plugins del Toolbox pueden ser empaquetados con npm/tsup:

```bash
# Construir un plugin
tsup ./plugins/my-plugin/src/index.ts --dts --format cjs,esm

# Publicar a npm
tnpm publish ./dist
```

### Scripts de Desarrollo

```bash
# Monitorea src/ y reconstruye automáticamente
onchange "src/**/*.ts" -- npm run build:core

# Terminal interactiva para el Toolbox (REPL)
toolbox shell

# Despliegue de staging para CI/CD
npm run build && npx pkg packages/cli/dist/index.js
```

## 📖 Guía de Referencia Rápida

| Función | Comando | Ejemplo |
|----------|---------|---------|
| Plantilla de proyecto | `toolbox new <type> <name>` | `toolbox new discord-bot myGuildBot` |
| Ejecutar código | `toolbox run <code>` | `toolbox run "get config.version"` |
| Cifrar | `toolbox encrypt <file>` | `toolbox encrypt secret.json` |
| Ofuscar | `toolbox obfuscate <dir>` | `toolbox obfuscate src/` |
| Servidor API | `toolbox api start` | `toolbox api start --port 8080` |
| Dump de Base de Datos | `toolbox storage query` | `toolbox storage query "SELECT * FROM users"` |
| Obfuscación | `toolbox obfuscate run` | `toolbox obfuscate run "contraseña"` |
| Plugins | `toolbox plugin list` | `toolbox plugin list` |
| Construir | `toolbox build <target>` | `toolbox build exe` |

## 🆘 Soporte y Comunidad

- **Documentación**: Consulta la wiki en (`./docs/`) para estilos de implementación específicos
- **Problemas**: Abre un issue en este repositorio para bugs / características
- **Colaboración**: ¡Arconlamiento bienvenido! Sigue la [guía de contribución](CONTRIBUTING.md)

## 🛡️ Seguridad

- **Administración de secretos**: Utiliza `toolbox secrets`
- **Cifrado**: Todas las claves maestra/secretos cifradas
- **Auditorías**: Detección automática de patrones vía `build:protected`
- **CI/CD**: Compilación segura en múltiples plataformas

## 🎯 Enfoque del Producto

El Toolbox es intencionalmente un **motor de desarrollo integral** con enfoque en productividad y consistencia:

- **Una sola fuente de verdad** (TypeScript, no JavaScript)
- **Disposiciones por capas** (módulos monolíticos, pero claros)
- **Herramientas de nivel empresarial** (ofuscación/cifrado/caché que respaldarían cualquier proyecto Discord profesional)
- **Una sola CLI que resuelve muchos problemas** (no múltiples CLI)

Si necesitas una terminal solo-para-comandos, es mejor usar la CLI nativa de tu OS. ¡El Toolbox es para *construir* proyectos, no para ejecutar utilidades Unix genéricas!

---

*¡Construye cosas increíbles! 💪*

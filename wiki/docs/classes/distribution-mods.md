# Categoría: Distribución y Gestión de Mods en Juego

Esta sección cubre dos de los sistemas más avanzados y demandados: cómo distribuir software a gran escala y cómo gestionar mods directamente desde la interfaz del juego.

## 📦 Sistema de Distribución (`DistributionPlatform`)
La distribución es el proceso de llevar el software a los clientes, ya sea mediante tiendas físicas o plataformas digitales propias.

### Gestión de Plataformas
- **`DistributionPlatform`**: Clase que representa una tienda o servicio de distribución (como tu propia versión de Steam).
- **`GetCut()` / `SetCut(float value)`**: Controla el porcentaje que la plataforma se queda por cada venta (ej: el estándar 30%).
- **`BandwidthPerSale` (float)**: La cantidad de ancho de banda necesaria por cada descarga. Si no tienes suficientes servidores, las ventas caerán.
- **`TargetUsers` (int)**: El número de usuarios potenciales a los que llega la plataforma.

### Métodos de Simulación
- **`AcceptableCut()`**: Devuelve el porcentaje máximo que las otras empresas están dispuestas a pagar para estar en tu plataforma.
- **`UpdateBandwidth()`**: Refresca la capacidad de red basada en tus grupos de servidores.

---

## 📥 Gestión de Mods en Tiempo Real (`ModController`)
Aunque Software Inc. suele cargar los mods al inicio, el `ModController` permite ciertas acciones avanzadas que pueden evitar tener que reiniciar el juego.

### Funciones del Controlador
- **`ModController.Instance.LoadMod(string folder)`**: Intenta cargar un mod desde una carpeta específica mientras el juego está corriendo.
- **`UnloadMod(ModMeta mod)`**: Desactiva y descarga un mod de la memoria.
- **`ReloadMod(ModMeta mod)`**: Útil para desarrolladores; recarga el código del mod sin salir al menú principal.

### Descarga de Contenido en Juego (`URLDownloader`)
Para lograr la descarga de mods sin salir del juego (un "Mod Browser" interno), se utilizan las clases de red:
- **`URLDownloader`**: Permite bajar archivos desde una dirección web directamente a la carpeta de mods.
- **`SteamWorkshop.DownloadItem(ulong id)`**: Si el mod está en Steam, este método inicia la descarga oficial.

---

## 🛠️ Idea de Mod: Navegador de Mods Interno
Para crear un sistema que descargue mods sin salir:

1. **Descarga:** Usa `URLDownloader` para bajar el archivo `.zip` o `.dll` a la carpeta `DLLMods`.
2. **Extracción:** Usa librerías de C# estándar para descomprimir (si es necesario).
3. **Carga Caliente:** Llama a `ModController.Instance.LoadMod("ruta/del/nuevo/mod")`.

> **Nota Técnica:** La "Carga Caliente" (Hot Loading) puede ser inestable si el mod modifica clases base del sistema que ya están inicializadas. Es recomendable usarlo para mods que añaden contenido nuevo (muebles, tipos de software) más que para mods que cambian el núcleo del juego.

---

## 📊 Ventas Digitales vs Físicas
- **`DigitalDistributionWindow`**: La interfaz donde el jugador configura su tienda online.
- **`PhysicalDistribution`**: Maneja la logística de cajas, camiones e inventario en almacenes.

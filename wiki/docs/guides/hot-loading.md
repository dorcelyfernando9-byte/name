# Guía Avanzada: Descarga y Carga de Mods en Tiempo Real

Lograr que los usuarios descarguen y activen mods sin salir del juego es el "Santo Grial" del modding en Software Inc. Aunque el juego está diseñado para cargar la mayoría de los mods al inicio, el motor permite la **carga en caliente (Hot Loading)** mediante el uso estratégico de las clases de red y el controlador de mods.

## El Proceso Técnico

Para implementar esta funcionalidad, tu mod debe seguir estos cuatro pasos:

### 1. Interfaz de Usuario (El "Mod Browser")
Debes crear una ventana usando `WindowManager` que liste los mods disponibles. Puedes inspirarte en la clase `SDFDownloader`, que ya tiene elementos para:
- **`Search()`**: Buscar contenido.
- **`PageForward()` / `PageBackward()`**: Navegar entre listas.
- **`LoadingCircle`**: Mostrar progreso de carga.

### 2. Descarga de Archivos (`URLDownloader`)
Una vez que el usuario elige un mod, debes descargarlo a la carpeta local de mods del juego.
- **`URLDownloader`**: Es la clase encargada de bajar datos de internet. Necesitas pasarle la URL directa al archivo `.dll` o `.zip`.
- **Ruta de destino**: Debes guardarlo en `ModController.Instance.ModFolder + "/DLLMods/NombreDelMod/"`.

### 3. Carga en Memoria (`ModController`)
Esta es la parte crítica. Una vez que el archivo está en el disco, debes decirle al juego que lo reconozca:
- **`ModController.Instance.LoadMod(string folder)`**: Este método escanea la carpeta proporcionada, busca el archivo `ModMeta` y carga el ensamblado en la memoria del juego.

### 4. Activación
Si el mod es de tipo `ModBehaviour`, deberás llamar a su método `OnActivate()` manualmente o esperar a que el `ModController` lo haga en el siguiente frame.

---

## Ejemplo de Código (SDK Concept)

Aquí tienes cómo se vería la lógica central en C#:

```csharp
public void DescargarYActivarMod(string url, string nombreMod) {
    string destino = ModController.Instance.ModFolder + "/DLLMods/" + nombreMod;
    
    // 1. Iniciamos la descarga
    URLDownloader downloader = new URLDownloader(url, (ex) => {
        if (ex == null) {
            // 2. Si la descarga tiene éxito, cargamos el mod
            Debug.Log("Descarga completada. Cargando mod...");
            ModController.Instance.LoadMod(destino);
            HUD.Instance.AddPopup("Mod Instalado", nombreMod + " ya está listo para usar.", null);
        } else {
            Debug.LogError("Error al descargar mod: " + ex.Message);
        }
    });
    downloader.Start();
}
```

## Limitaciones y Advertencias
- **Dependencias:** Si un mod depende de otro que no está cargado, `LoadMod` podría fallar o causar un crash.
- **Muebles y Datos:** Los mods que añaden nuevos tipos de muebles (`FurnitureMod`) a veces requieren que el `FurnitureLoader` refresque su caché, lo cual es más complejo que simplemente cargar la DLL.
- **Seguridad:** Siempre advierte a los usuarios sobre los riesgos de descargar código ejecutable (`.dll`) de fuentes desconocidas dentro del juego.

---

## Reto: ¿Es posible automatizarlo?
Sí. Con el `Metadata Dumper` que creamos, puedes ver que `ModController` tiene un campo `Mods` (una lista de todos los mods cargados). Podrías crear un mod que vigile la carpeta `DLLMods` y, cada vez que aparezca un archivo nuevo, lo cargue automáticamente.

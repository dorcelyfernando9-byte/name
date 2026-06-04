# Guía: Cómo Añadir un Nuevo Apartado de Instalación de Mods

Esta guía explica cómo integrar un nuevo "apartado" o sección en la interfaz de Software Inc. para que los usuarios puedan instalar mods sin salir del juego.

## 1. Crear el Botón en la Interfaz (HUD)

Para que el apartado sea accesible, lo ideal es añadir un botón en la barra inferior del juego. Usaremos el método `AddBottomButton` de la clase `HUD`.

### Código de Ejemplo:
```csharp
public override void OnActivate() {
    // Añadimos el botón al HUD al activar el mod
    // HUD.Instance.AddBottomButton(VentanaModBrowser, "Mod Store", "Descarga e instala mods", IconoTienda);
}
```

## 2. Definir la Ventana del "Mod Browser"

Debes crear una clase que herede de `GUIWindow` para diseñar el apartado de instalación.

### Estructura Recomendada:
- **Lista de Mods:** Usa un `GUIListView` o un `GUIComplexList` para mostrar los mods disponibles en internet.
- **Botón de Instalar:** Al hacer clic, debe disparar la descarga usando `URLDownloader`.
- **Barra de Progreso:** Usa `GUIProgressBar` para informar al usuario sobre la descarga.

## 3. Lógica de Instalación "Invisible"

Para que el usuario no sienta que ha salido del juego, la instalación debe ocurrir en segundo plano:

1. **Descarga silenciosa:** El archivo se descarga en la carpeta `DLLMods` del juego.
2. **Carga automática:** Una vez descargado, el mod se registra usando `ModController.Instance.LoadMod()`.
3. **Notificación:** Se usa `HUD.Instance.AddPopup()` para avisar que el nuevo apartado o mod ya está activo.

---

## 🛠️ Reto: Añadirlo al Menú Principal

Si prefieres que el apartado esté en el **Menú Principal** (antes de cargar una partida), debes interactuar con `MainMenuController`:

- **`MainMenuController.Instance.MainPanel`**: Puedes añadir un nuevo botón a este panel que abra tu ventana de instalación.
- **`MainMenuTree`**: Puedes insertar un nuevo nodo en el árbol de navegación del menú.

## Ejemplo de Flujo de Usuario:
1. El jugador hace clic en el nuevo icono de "Engranaje con Flecha" en el HUD.
2. Se abre una ventana lateral con los "Mods Populares de la Semana".
3. El jugador pulsa "Instalar" en un mod de "Empresas Reales".
4. El juego descarga el mod, lo activa, y los nombres de las empresas cambian al instante sin reiniciar.

---
*Consejo: Para que los nombres cambien al instante, asegúrate de llamar a `Localization.Refresh()` o similar después de cargar el mod.*

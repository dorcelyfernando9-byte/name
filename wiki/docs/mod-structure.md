# Estructura de un Mod

Un mod de código funcional en Software Inc. requiere al menos dos clases que hereden de las clases base del juego.

## 1. ModMeta
Esta clase define la identidad de tu mod y aparece en el menú de opciones del juego.

```csharp
using UnityEngine;
using UnityEngine.UI;

namespace MiMod {
    internal class MiModMeta : ModMeta {
        public override string Name => "Mi Super Mod";

        public override void ConstructOptionsScreen(RectTransform parent, bool inGame) {
            Text text = WindowManager.SpawnLabel();
            text.text = "Configuración de mi mod.";
            text.transform.SetParent(parent, false);
        }
    }
}
```

## 2. ModBehaviour
Aquí es donde reside la lógica de tu mod. Funciona de manera similar a un `MonoBehaviour` de Unity.

```csharp
using UnityEngine;

namespace MiMod {
    public class MiModLogic : ModBehaviour {
        public override void OnActivate() {
            Debug.Log("Mod activado");
        }

        public override void OnDeactivate() {
            Debug.Log("Mod desactivado");
        }

        void Update() {
            if (Input.GetKeyDown(KeyCode.F9)) {
                // Ejemplo: Mostrar un popup en el juego
                HUD.Instance.AddPopup("Mod Info", "¡Has presionado F9!", null);
            }
        }
    }
}
```

## Permisos Especiales
Si tu mod necesita acceder al sistema de archivos fuera de la carpeta del juego o realizar peticiones de red, debes añadir esto en tu `ModMeta`:

```csharp
public static bool GiveMeFreedom = true;
```
*Nota: Esto deshabilitará la compatibilidad con Steam Workshop.*

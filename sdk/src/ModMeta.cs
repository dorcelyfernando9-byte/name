using UnityEngine;
using UnityEngine.UI;

namespace MiNuevoMod {
    internal class MiModMeta : ModMeta {
        // Nombre que aparecerá en el juego
        public override string Name => "SDK Mod Example";

        // Configuración en el menú del juego
        public override void ConstructOptionsScreen(RectTransform parent, bool inGame) {
            Text text = WindowManager.SpawnLabel();
            text.text = "¡Este mod fue creado usando el SDK en Codespace!";
            text.transform.SetParent(parent, false);
        }
    }
}

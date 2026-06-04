# Referencia de Clases Principales (API)

Esta es la lista de las clases más importantes descubiertas en la versión 1.8.38 de Software Inc. Úsalas como punto de referencia para crear tus mods con el SDK.

## Lógica de Empresa y Simulación

### `Company` (Singleton: `Company.Instance`)
Es el corazón de la simulación del jugador.
- **`Money` (float):** Cantidad actual de dinero.
- **`Name` (string):** Nombre de la empresa.
- **`Staff` (List<Actor>):** Lista de todos los empleados contratados.
- **`Products` (List<SoftwareProduct>):** Lista de productos desarrollados.

### `Actor` (Clase Base)
Representa a cualquier personaje en el juego (jugador o empleado).
- **`IsPlayer` (bool):** Si el personaje es el jugador.
- **`Stress` (float):** Nivel de estrés actual.
- **`Energy` (float):** Energía restante.

## Interfaz de Usuario (UI)

### `HUD` (Singleton: `HUD.Instance`)
Maneja los elementos visuales que el jugador ve en todo momento.
- **`AddPopup(string title, string text, Sprite icon)`**: Muestra una notificación en la pantalla.
- **`AddIncome(float amount, string label)`**: Muestra visualmente una ganancia de dinero.

### `WindowManager` (Singleton: `WindowManager.Instance`)
Maneja la creación de ventanas y menús.
- **`SpawnLabel()`**: Crea un texto dinámico.
- **`SpawnButton()`**: Crea un botón interactivo.

---
*Nota: Si encuentras más clases usando herramientas locales, agrégalas a esta lista para expandir la wiki.*

# Categoría: Realismo y Personalización Avanzada

Para los modders que buscan una experiencia más realista, Software Inc. ofrece sistemas profundos de mercado, localización y generación de nombres.

## 🌍 Localización y Renombrado (`Localization`)
Esta clase permite cambiar cualquier texto del juego, desde nombres de botones hasta categorías de software.

### Métodos de Personalización
- **`Loc(string key)`**: Devuelve el texto traducido asociado a una clave. Puedes usar esto para encontrar qué claves usa el juego.
- **`SetTranslation(string key, string value)`**: Permite sobrescribir cualquier texto en tiempo de ejecución. Útil para mods que renombran empresas o productos automáticamente.
- **`GetSoftwareCat(string cat)`**: Devuelve el nombre localizado de una categoría de software (ej: "Office Software").

## 📈 Simulación de Mercado (`MarketSimulation`)
Controla cómo se comportan las empresas de la IA y cómo reacciona el público a los productos.

### Funciones de Realismo
- **`GetPhysicalVsDigital(SoftwareProduct product)`**: Devuelve la proporción de ventas físicas frente a digitales. Puedes modificar esto para simular un mercado moderno o retro.
- **`GetAllCompanies()`**: Devuelve una lista de todas las empresas en el mundo (Jugador + IA).
- **`add_OnCompanyFounded`**: Evento que se dispara cuando nace una nueva empresa. Ideal para mods que inyectan empresas reales históricas.

## 🏢 Identidad Corporativa (`CoredumpingGenerator`)
Maneja la creación visual de las empresas.
- **`GenerateLogo()`**: Crea un logo procedimental para una empresa. Puedes usarlo para asignar logos específicos a empresas reales.

---

## 🛠️ Guía: Cómo Renombrar Elementos del Juego
Si quieres que tu mod cambie el nombre de un equipo o un producto para hacerlo más realista:

### Ejemplo: Renombrar un Equipo
```csharp
public void RenombrarEquipoRealista(Team equipo, string nuevoNombre) {
    equipo.Name = nuevoNombre;
    HUD.Instance.AddPopup("Gestión", "Equipo renombrado a: " + nuevoNombre, null);
}
```

### Ejemplo: Cambiar una Traducción Global
```csharp
// Cambia "Money" por "Capital Social" en toda la interfaz
Localization.SetTranslation("Money", "Capital Social");
```

---

## 🌟 Fans y Popularidad Realista
La popularidad de una empresa no es solo un número; depende de los eventos de mercado.
- **`MarketEvent`**: Representa sucesos mundiales (crisis económicas, booms tecnológicos).
- **`Company.BusinessReputation`**: Determina qué tan fácil es contratar talento de alto nivel. Un mod de realismo podría hacer que la reputación caiga drásticamente si despides a muchos empleados a la vez.

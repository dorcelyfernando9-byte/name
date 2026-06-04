# Categoría: Empleados y Actores

En Software Inc., todos los personajes (incluido el jugador) son instancias de la clase `Actor`. Los empleados contratados extienden esta lógica a través de la clase `Employee`.

## Clase `Actor`
Es la clase base para cualquier entidad física que se mueve en el juego.

### Propiedades Clave
- **`Stress` (float):** Nivel de estrés del actor. Si es muy alto, el empleado puede renunciar.
- **`Energy` (float):** Energía física. Determina cuándo el actor necesita descansar o irse a casa.
- **`Team` (Team):** El equipo al que pertenece el actor.
- **`currentRoom` (Room):** La habitación donde se encuentra el actor actualmente.

### Métodos Principales
- **`InteractWith(Furniture furniture)`**: Ordena al actor interactuar con un mueble específico (ej. sentarse en una silla).
- **`UpdateSkinColor()` / `UpdateHairColor()`**: Métodos para cambiar la apariencia visual del actor.
- **`Arrest()`**: Lógica usada por los guardias de seguridad para detener intrusos.
- **`PanicBurglar()`**: Reacción de los empleados ante un robo.

---

## Clase `Employee`
Contiene la lógica específica de los trabajadores de tu empresa.

### Propiedades Clave
- **`Salary` (float):** El sueldo mensual del empleado.
- **`Skill` (SkillLevel):** Nivel de habilidad en diferentes áreas (Programación, Diseño, etc.).
- **`Satisfaction` (float):** Qué tan feliz está el empleado con su trabajo.

### Métodos Principales
- **`GetSalary()`**: Devuelve el salario actual.
- **`SetSalary(float value)`**: Cambia el sueldo (útil para mods de gestión económica).
- **`GetTotalSkill()`**: Calcula la habilidad total combinada del empleado.

---

## Cómo usar en Mods
Para obtener todos los empleados de la empresa del jugador:
```csharp
var empleados = Company.Instance.Staff;
foreach(var actor in empleados) {
    Debug.Log("Empleado: " + actor.Name + " - Estrés: " + actor.Stress);
}
```

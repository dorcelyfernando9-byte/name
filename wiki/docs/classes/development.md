# Categoría: Tiempo y Ciclos de Desarrollo

Esta sección explica cómo el juego maneja el paso del tiempo y el progreso de los proyectos de software.

## Clase `SDateTime` (El Reloj del Juego)
Software Inc. utiliza su propio sistema de tiempo para manejar los meses y años de simulación.

### Métodos de Lectura
- **`GetYear()` (int):** Año actual de la simulación.
- **`GetMonth()` (int):** Mes actual (1 a 12).
- **`GetDay()` (int):** Día del mes.
- **`GetHour()` (int):** Hora actual (0 a 23).
- **`ToTimeString()` (string):** Devuelve la hora formateada (ej: "09:00 AM").

### Manipulación
- **`op_Addition` / `op_Subtraction`**: Puedes sumar o restar tiempo usando operadores estándar sobre objetos `SDateTime`.

---

## Desarrollo de Software (`SoftwareWorkItem`)
Cada producto en desarrollo es un "Work Item".

### Propiedades de Progreso
- **`Progress` (float):** Valor de 0.0 a 1.0 que indica el avance total de la fase actual.
- **`Quality` (float):** La calidad actual del código o diseño. Aumenta con el tiempo y la habilidad de los empleados.
- **`Bugs` (float):** Cantidad de errores detectados. Se eliminan durante la fase de Beta.

### Fases de Desarrollo
1. **Diseño:** El progreso depende de los diseñadores.
2. **Alfa (Desarrollo):** Los programadores escriben el código.
3. **Beta (Depuración):** Se eliminan los bugs antes del lanzamiento.
4. **Lanzamiento:** El producto sale al mercado.

---

## Modding del Tiempo de Desarrollo
Si quieres un mod que acelere el desarrollo de todos los proyectos:

```csharp
public void AcelerarDesarrollo() {
    foreach(var workItem in Company.Instance.WorkItems) {
        if (workItem is SoftwareWorkItem sw) {
            sw.Progress += 0.01f; // Añade un 1% de progreso extra cada vez que se llama
        }
    }
}
```

## Control del Tiempo (`TimeOfDay`)
Esta clase controla la velocidad de la simulación (Pausa, Velocidad 1, 2 o 3).
- **`TimeOfDay.Instance.PlayValue`**: Cambia la velocidad actual del juego.

# Categoría: Muebles y Objetos

La clase `Furniture` es la base de todos los objetos que puedes colocar en una habitación. Gestiona desde escritorios hasta servidores y plantas.

## Clase `Furniture`

### Propiedades de Consumo
- **`CurrentWattage` (float):** El consumo eléctrico actual del objeto.
- **`GetElectricityPrice()` / `GetWaterPrice()`**: Métodos que calculan el coste operativo del mueble por mes.
- **`IsOn` (bool):** Indica si el mueble está encendido (relevante para computadoras y luces).

### Estado y Mantenimiento
- **`Broken` (bool):** Indica si el mueble está estropeado y necesita reparación.
- **`GetStockLeft()`**: Usado para muebles que dispensan algo (como máquinas de café o impresoras).
- **`Repair()`**: Método (usualmente llamado por el conserje) para arreglar el objeto.

### Atributos de Simulación
- **`BoostValue` (float):** Qué tanto mejora este mueble la eficiencia de los empleados cercanos.
- **`ComputerPower` (float):** Si el mueble es una computadora, determina la velocidad de trabajo.
- **`Insurable` (bool):** Indica si el objeto puede ser cubierto por un seguro contra incendios o robos.

---

## Modding de Muebles
Si quieres crear un mod que cambie el comportamiento de un mueble al romperse:

```csharp
public override void OnFurnitureBreak(Furniture furn) {
    if (furn.Broken) {
        HUD.Instance.AddPopup("¡Avería!", "El mueble " + furn.Name + " ha dejado de funcionar.", null);
    }
}
```

## Sistema de Colocación (`BuildController`)
Para manipular muebles mediante código (spawnear objetos):
- **`BuildController.Instance.PlaceFurniture(Furniture prefab, Vector3 position)`**: Método principal para colocar muebles dinámicamente.

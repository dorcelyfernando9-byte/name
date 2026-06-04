# Categoría: Gestión de Empresas

La clase `Company` es fundamental para cualquier mod que interactúe con las finanzas, los productos o la reputación de las empresas (tanto del jugador como de la IA).

## Clase `Company`

### Finanzas y Valoración
- **`Money` (double):** Cantidad de dinero líquido de la empresa.
- **`Valuation` (long):** El valor total estimado de la empresa en el mercado.
- **`GetShareWorth()`**: Calcula el valor de una sola acción de la empresa.
- **`HostChangeMoney(double amount, string label)`**: Método seguro para añadir o quitar dinero (sincronizado en multijugador).

### Reputación y Fans
- **`Fans` (int):** Número de seguidores leales que comprarán casi cualquier producto de la empresa.
- **`BusinessReputation` (float):** La reputación general de la empresa en el mundo de los negocios.
- **`BusinessStars` (int):** La calificación en estrellas (1 a 5) de la empresa.

### Desarrollo y Productos
- **`Products` (List<SoftwareProduct>):** Lista de todo el software lanzado o en desarrollo.
- **`GetLatestResearch()`**: Devuelve el nivel de investigación más avanzado alcanzado por la empresa.
- **`CanMakeSequel(SoftwareProduct product)`**: Comprueba si es posible desarrollar una secuela para un producto existente.

---

## Modding de Empresas
Si quieres crear un mod que dé un bono de fans al jugador al realizar una acción:

```csharp
public void RecompensarJugador() {
    Company.Instance.Fans += 1000;
    HUD.Instance.AddPopup("¡Éxito Viral!", "Has ganado 1000 nuevos fans.", null);
}
```

## Empresas de la IA (`SimulatedCompany`)
Para interactuar con empresas competidoras, se utiliza la clase `SimulatedCompany`, que hereda de `Company` pero incluye lógica de decisión automatizada.

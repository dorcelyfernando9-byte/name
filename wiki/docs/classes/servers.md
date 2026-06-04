# Categoría: Servidores e Infraestructura

El sistema de servidores en Software Inc. gestiona el alojamiento de sitios web, bases de datos y servicios en la nube. Un mod puede manipular la capacidad, el coste y la conectividad de estos equipos.

## Clase `Server`
Representa una unidad física de servidor colocada en el mundo.

### Propiedades de Conectividad
- **`ServerName` (string):** El nombre asignado al servidor.
- **`Available` (float):** La capacidad de procesamiento disponible en este servidor.
- **`Power` (float):** El consumo eléctrico o potencia de procesamiento bruta.
- **`WiredTo` (List<Server>):** Lista de servidores a los que está conectado mediante cables.

### Métodos de Gestión
- **`GetISPCost()`**: Devuelve el coste mensual de internet (ISP) que genera este servidor.
- **`WireTo(Server other)`**: Establece una conexión física entre este servidor y otro.
- **`ReWire()`**: Refresca las conexiones de red.

---

## Clase `ServerGroup`
Permite agrupar varios servidores para manejar tareas de gran carga (como el hosting de un sistema operativo popular).

### Métodos Principales
- **`GetAvailable()`**: Devuelve la capacidad total libre de todo el grupo de servidores.
- **`AddServer(Server s)`**: Añade un servidor físico al grupo lógico.

---

## Modding de Infraestructura
Si quieres crear un mod que reduzca el coste de ISP:

```csharp
public void OptimizarServidores() {
    foreach(var group in Company.Instance.ServerGroups) {
        foreach(var server in group.Servers) {
            server.ISPCost *= 0.5f; // Reducción del 50% en el coste de internet
        }
    }
}
```

# Wiki Ultra Detallada: Clase `Company`

Esta sección analiza en profundidad la lógica interna de la clase `Company`, el pilar de la simulación económica en Software Inc. (v1.8.38).

## 1. Resumen de Responsabilidades
La clase `Company` gestiona:
- El balance financiero (`Money`).
- La base de seguidores (`Fans`).
- La reputación en el mercado (`BusinessReputation`).
- El ciclo de vida de los productos de software.
- La relación con subsidiarias e inversores.

## 2. Análisis de Métodos (Lógica Interna)

### `HostChangeMoney(double amount, string label)`
- **Propósito:** Es el método principal para modificar el dinero de la empresa.
- **Funcionamiento:** A diferencia de cambiar la propiedad `Money` directamente, este método registra la transacción para el historial contable y asegura la sincronización en partidas multijugador.
- **Uso en Modding:** Úsalo siempre que quieras dar o quitar dinero para que aparezca correctamente en los balances financieros.

### `GetShareWorth()`
- **Lógica:** Calcula el valor de una acción basándose en:
  - `Valuation` (Valoración total).
  - Activos físicos (Muebles, edificios).
  - Valor de mercado de los productos lanzados.
  - Deudas y préstamos pendientes.
- **Fórmula Interna:** Aproximadamente `(Valuation + Liquidez) / TotalAcciones`.

### `CanMakeSequel(SoftwareProduct product)`
- **Lógica:** Devuelve un booleano. Verifica que:
  1. El producto ya haya sido lanzado.
  2. No haya otra secuela en desarrollo actualmente.
  3. Haya pasado el tiempo suficiente desde el lanzamiento (determinado por el tipo de software).

### `BeginTakeover()`
- **Lógica:** Inicia el proceso de adquisición de otra empresa. 
- **Efecto:** Dispara la ventana de negociación de compra de acciones y evalúa si el jugador tiene suficiente capital para el "hostile takeover".

## 3. Bytecode y Referencias (Intermediate Language - IL)

Si estás usando **Harmony** para parchear este método, ten en cuenta los siguientes *OpCodes* comunes en esta clase:
- `ldarg.0`: Carga la instancia actual de la empresa (`this`).
- `callvirt`: Llama a métodos virtuales como `get_Money`.
- `stfld`: Almacena valores en campos como `_fans`.

## 4. Campos Críticos (Variables Internas)
- **`_fans` (int):** Almacena el número bruto de seguidores.
- **`Valuation` (long):** Se actualiza al final de cada mes en el método `TurnMonth()`.
- **`Staff` (List<Actor>):** Lista dinámica. Añadir actores aquí los convierte automáticamente en empleados.

---
*Esta documentación se basa en el análisis de metadatos y la reconstrucción de lógica de la versión 1.8.38.*

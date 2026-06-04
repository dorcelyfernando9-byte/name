# Guía de Inicio

Para empezar a crear mods de código en Software Inc., necesitas configurar tu entorno de desarrollo.

## Requisitos
- **Visual Studio** o **JetBrains Rider**.
- **.NET Framework 4.0** (o 4.5 dependiendo de la versión del juego).
- **dnSpy** o **ILSpy** (para explorar el código original del juego).

## Referencias Necesarias
En tu proyecto de C#, debes añadir como referencias los siguientes archivos que se encuentran en `Software Inc/Software Inc_Data/Managed/`:

1. `Assembly-CSharp.dll` (Lógica principal del juego).
2. `UnityEngine.dll` (Motor Unity).
3. `UnityEngine.UI.dll` (Interfaz de usuario).
4. `UnityEngine.CoreModule.dll` (Si usas una versión moderna de Unity).

## Ubicación de los Mods
Los mods de código deben colocarse en:
`Software Inc/DLLMods/[NombreDeTuMod]/`

Puedes usar archivos `.cs` directamente (el juego los compilará) o una `.dll` compilada por ti.

> **Importante:** Si usas una `.dll`, el mod no se podrá subir a la Steam Workshop por razones de seguridad, a menos que uses el sistema de scripts del juego.

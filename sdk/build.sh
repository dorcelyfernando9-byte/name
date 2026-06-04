#!/bin/bash
echo "Compilando el Mod para Software Inc..."

# Verificar si las DLLs existen
if [ ! -f "sdk/lib/Assembly-CSharp.dll" ]; then
    echo "ERROR: No se encontró Assembly-CSharp.dll en sdk/lib/"
    echo "Por favor, copia las DLLs del juego a la carpeta sdk/lib/"
    exit 1
fi

# Compilar usando dotnet
dotnet build sdk/MyMod.csproj -o sdk/dist

echo "--------------------------------------"
echo "Si no hubo errores, tu mod está en: sdk/dist/MiNuevoMod.dll"

using System;
using System.IO;
using System.Reflection.Metadata;
using System.Reflection.PortableExecutable;
using System.Text;
using System.Linq;

namespace MetadataDumper
{
    class Program
    {
        static void Main(string[] args)
        {
            if (args.Length == 0)
            {
                Console.WriteLine("Uso: dotnet run -- <ruta_a_la_dll>");
                return;
            }

            string dllPath = args[0];
            using (var fs = new FileStream(dllPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
            using (var peReader = new PEReader(fs))
            {
                MetadataReader reader = peReader.GetMetadataReader();
                using (StreamWriter sw = new StreamWriter("../wiki_completa_raw.txt"))
                {
                    sw.WriteLine($"=== DUMP COMPLETO DE METADATOS: {dllPath} ===");

                    foreach (var typeHandle in reader.TypeDefinitions)
                    {
                        TypeDefinition typeDef = reader.GetTypeDefinition(typeHandle);
                        string typeName = reader.GetString(typeDef.Name);
                        string typeNamespace = reader.GetString(typeDef.Namespace);
                        
                        sw.WriteLine($"\n[CLASE] {typeNamespace}.{typeName}");

                        // Metodos
                        foreach (var methodHandle in typeDef.GetMethods())
                        {
                            MethodDefinition methodDef = reader.GetMethodDefinition(methodHandle);
                            string methodName = reader.GetString(methodDef.Name);
                            
                            var parameters = methodDef.GetParameters();
                            string paramStr = "";
                            foreach (var pHandle in parameters)
                            {
                                Parameter param = reader.GetParameter(pHandle);
                                string pName = reader.GetString(param.Name);
                                paramStr += (paramStr == "" ? "" : ", ") + pName;
                            }

                            sw.WriteLine($"  - Metodo: {methodName}({paramStr})");
                        }

                        // Campos (Fields)
                        foreach (var fieldHandle in typeDef.GetFields())
                        {
                            FieldDefinition fieldDef = reader.GetFieldDefinition(fieldHandle);
                            string fieldName = reader.GetString(fieldDef.Name);
                            sw.WriteLine($"  - Campo: {fieldName}");
                        }

                        // Propiedades
                        foreach (var propHandle in typeDef.GetProperties())
                        {
                            PropertyDefinition propDef = reader.GetPropertyDefinition(propHandle);
                            string propName = reader.GetString(propDef.Name);
                            sw.WriteLine($"  - Propiedad: {propName}");
                        }
                    }
                }
            }
            Console.WriteLine("¡Extraccion completa! Revisa 'wiki_completa_raw.txt'");
        }
    }
}

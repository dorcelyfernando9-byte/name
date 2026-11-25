#!/usr/bin/env python3
"""
Roblox + Delta Executor Simulator
Simula el entorno de Roblox y Delta para testear scripts Lua sin abrir el juego.
"""

import subprocess
import sys
import os
import json
import re
from pathlib import Path

# =============================================
# INSTALAR LUPA SI NO ESTÁ
# =============================================
def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package, "-q"])

try:
    import lupa
except ImportError:
    print("Instalando lupa (Lua runtime)...")
    install("lupa")
    import lupa

from lupa import LuaRuntime, LuaError

# =============================================
# ENTORNO SIMULADO DE ROBLOX
# =============================================

class RobloxInstance:
    def __init__(self, class_name, name, parent=None):
        self.ClassName = class_name
        self.Name = name
        self.Parent = parent
        self._children = []
        self._properties = {}
        self.Source = ""

    def GetChildren(self):
        return self._children

    def GetDescendants(self):
        result = []
        for child in self._children:
            result.append(child)
            result.extend(child.GetDescendants())
        return result

    def IsA(self, class_name):
        return self.ClassName == class_name

    def GetFullName(self):
        if self.Parent and self.Parent.Name != "game":
            return self.Parent.GetFullName() + "." + self.Name
        return self.Name

    def FindFirstChild(self, name):
        for child in self._children:
            if child.Name == name:
                return child
        return None

    def __getitem__(self, key):
        return self.FindFirstChild(key)

    def __repr__(self):
        return f"Instance({self.ClassName}, {self.Name})"


class SimulatedGame:
    """Simula game de Roblox con estructura básica de Superstar Baseball"""

    def __init__(self):
        self.PlaceId = 101432174163538
        self.Name = "[PARK] Superstar Baseball"
        self._services = {}
        self._children = []
        self._build_tree()

    def _make(self, class_name, name, parent=None):
        inst = RobloxInstance(class_name, name, parent)
        if parent:
            parent._children.append(inst)
        return inst

    def _build_tree(self):
        # Workspace
        ws = self._make("Workspace", "Workspace")
        self._make("Part", "BaseField", ws)
        self._make("Part", "HomeBase", ws)
        pitcher = self._make("Model", "Pitcher", ws)
        self._make("Part", "HumanoidRootPart", pitcher)
        self._make("Humanoid", "Humanoid", pitcher)

        # Players
        players = self._make("Folder", "Players")
        lp = self._make("Model", "LocalPlayer", players)
        lp.UserId = 12345
        lp.Name = "TestPlayer"
        char = self._make("Model", "Character", lp)
        self._make("Part", "HumanoidRootPart", char)
        self._make("Humanoid", "Humanoid", char)
        hrp = self._make("Part", "HumanoidRootPart", char)
        hrp.Position = {"X": 0, "Y": 5, "Z": 0}

        # ReplicatedStorage con RemoteEvents típicos de baseball
        rs = self._make("ReplicatedStorage", "ReplicatedStorage")
        remotes = self._make("Folder", "Remotes", rs)
        self._make("RemoteEvent", "SwingBat", remotes)
        self._make("RemoteEvent", "PitchBall", remotes)
        self._make("RemoteEvent", "CatchBall", remotes)
        self._make("RemoteEvent", "UpdateScore", remotes)
        self._make("RemoteFunction", "GetBallPosition", remotes)
        self._make("RemoteFunction", "GetGameState", remotes)

        # LocalScripts simulados
        sc = self._make("Folder", "StarterPlayerScripts")
        main_ls = self._make("LocalScript", "MainClient", sc)
        main_ls.Source = """
-- MainClient (simulado)
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local function onSwing(power)
    -- logica de swing
end
"""
        swing_ls = self._make("LocalScript", "SwingController", sc)
        swing_ls.Source = """
-- SwingController (simulado)
local UIS = game:GetService("UserInputService")
local swingRemote = game.ReplicatedStorage.Remotes.SwingBat
UIS.InputBegan:Connect(function(input)
    if input.KeyCode == Enum.KeyCode.Space then
        swingRemote:FireServer({power = 1.0})
    end
end)
"""
        aim_ls = self._make("LocalScript", "AimController", sc)
        aim_ls.Source = """
-- AimController (simulado)
local aimRemote = game.ReplicatedStorage.Remotes.PitchBall
local function calculateAim(ballPos, playerPos)
    return (ballPos - playerPos).Unit
end
"""
        self._services = {
            "Workspace": ws,
            "Players": players,
            "ReplicatedStorage": rs,
            "StarterPlayerScripts": sc,
        }
        self._all = [ws, players, rs, sc]

    def GetService(self, name):
        return self._services.get(name, RobloxInstance("Service", name))

    def GetDescendants(self):
        result = []
        for svc in self._all:
            result.append(svc)
            result.extend(svc.GetDescendants())
        return result

    def HttpGet(self, url):
        """Simula HttpGet - solo devuelve placeholder"""
        return f"-- HttpGet simulado: {url}\nreturn {{}}"


# =============================================
# SIMULADOR DE DELTA (APIs del executor)
# =============================================

class DeltaSimulator:
    def __init__(self, workspace_path="./delta_workspace"):
        self.workspace = Path(workspace_path)
        self.workspace.mkdir(parents=True, exist_ok=True)
        self._files = {}

    def writefile(self, path, content):
        full = self.workspace / path
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_text(str(content), encoding="utf-8")
        self._files[path] = str(content)

    def readfile(self, path):
        full = self.workspace / path
        if full.exists():
            return full.read_text(encoding="utf-8")
        raise FileNotFoundError(f"File not found: {path}")

    def isfile(self, path):
        return (self.workspace / path).is_file()

    def isfolder(self, path):
        return (self.workspace / path).is_dir()

    def makefolder(self, path):
        (self.workspace / path).mkdir(parents=True, exist_ok=True)

    def listfiles(self, path="."):
        target = self.workspace / path
        if not target.exists():
            return []
        return [str(p.relative_to(self.workspace)) for p in target.iterdir()]

    def get_written_files(self):
        return list(self._files.keys())


# =============================================
# RUNNER PRINCIPAL
# =============================================

class RobloxScriptTester:
    def __init__(self):
        self.game = SimulatedGame()
        self.delta = DeltaSimulator()
        self.lua = LuaRuntime(unpack_returned_tuples=True)
        self.logs = []
        self.warnings = []
        self.errors = []

    def _log(self, *args):
        msg = " ".join(str(a) for a in args)
        self.logs.append(msg)
        print(f"  [print] {msg}")

    def _warn(self, *args):
        msg = " ".join(str(a) for a in args)
        self.warnings.append(msg)
        print(f"  [warn]  ⚠ {msg}")

    def _setup_globals(self):
        lua = self.lua
        g = lua.globals()
        delta = self.delta
        game_sim = self.game

        # print / warn
        g.print = self._log
        g.warn = self._warn

        # task
        lua.execute("""
            task = {
                wait = function(n) end,
                spawn = function(fn) pcall(fn) end,
                delay = function(t, fn) pcall(fn) end,
            }
        """)

        # wait
        lua.execute("function wait(n) end")

        # Delta filesystem APIs
        g.writefile   = delta.writefile
        g.readfile    = delta.readfile
        g.isfile      = delta.isfile
        g.isfolder    = delta.isfolder
        g.makefolder  = delta.makefolder
        g.listfiles   = delta.listfiles

        # game object
        g.game = lua.table()
        g.game.PlaceId = game_sim.PlaceId
        g.game.Name    = game_sim.Name

        # game:GetService
        def get_service(_, name):
            # Servicios con stubs especiales en Lua
            lua_services = {
                "MarketplaceService", "TweenService", "UserInputService",
                "Players", "ReplicatedStorage", "Workspace"
            }
            if name in lua_services:
                result = lua.eval(name)
                return result
            svc = game_sim.GetService(name)
            t = lua.table()
            t.Name = svc.Name
            t.ClassName = svc.ClassName
            return t
        g.game.GetService = get_service

        # game:GetDescendants
        def get_descendants(_):
            descs = game_sim.GetDescendants()
            t = lua.table()
            for i, d in enumerate(descs, 1):
                item = lua.table()
                item.Name      = d.Name
                item.ClassName = d.ClassName
                item.Source    = d.Source

                def make_isa(cn):
                    def isa(_, class_name):
                        return cn == class_name
                    return isa
                item.IsA = make_isa(d.ClassName)

                def make_fullname(inst):
                    def gfn(_):
                        return inst.GetFullName()
                    return gfn
                item.GetFullName = make_fullname(d)

                t[i] = item
            return t
        g.game.GetDescendants = get_descendants

        # game:HttpGet
        def http_get(_, url):
            return game_sim.HttpGet(url)
        g.game.HttpGet = http_get

        # Players.LocalPlayer simulado
        lua.execute("""
            Players = {
                LocalPlayer = {
                    Name = "TestPlayer",
                    UserId = 12345,
                    PlayerGui = { Name = "PlayerGui", ClassName = "PlayerGui" },
                    Character = {
                        Name = "Character",
                        HumanoidRootPart = { Position = { X=0, Y=5, Z=0 } }
                    }
                }
            }
        """)

        # Instance.new simulado
        lua.execute("""
            Instance = {}
            Instance.new = function(className, parent)
                local inst = {
                    ClassName = className,
                    Name = className,
                    Parent = parent,
                    _children = {},
                    Visible = true,
                    Value = nil,
                }
                -- metodos basicos
                inst.GetChildren = function(self) return self._children end
                inst.GetDescendants = function(self)
                    local r = {}
                    for _, c in ipairs(self._children) do
                        table.insert(r, c)
                    end
                    return r
                end
                inst.FindFirstChild = function(self, name)
                    for _, c in ipairs(self._children) do
                        if c.Name == name then return c end
                    end
                    return nil
                end
                inst.IsA = function(self, cn) return self.ClassName == cn end
                inst.Destroy = function(self) self.Parent = nil end
                inst.Clone = function(self) return self end
                -- eventos simulados
                inst.MouseButton1Click = { Connect = function(self, fn) end }
                inst.InputBegan = { Connect = function(self, fn) end }
                inst.InputEnded = { Connect = function(self, fn) end }
                inst.Changed = { Connect = function(self, fn) end }
                inst.OnServerEvent = { Connect = function(self, fn) end }
                inst.OnClientEvent = { Connect = function(self, fn) end }
                -- si tiene parent, agregar como hijo
                if parent and parent._children then
                    table.insert(parent._children, inst)
                end
                return inst
            end
        """)

        # UDim2, Color3, Vector3, etc. (stubs)
        lua.execute("""
            UDim2 = {
                new = function(xs, xo, ys, yo)
                    return { X={Scale=xs,Offset=xo}, Y={Scale=ys,Offset=yo} }
                end
            }
            Color3 = {
                fromRGB = function(r,g,b) return {R=r/255,G=g/255,B=b/255} end,
                new = function(r,g,b) return {R=r,G=g,B=b} end,
            }
            Vector3 = {
                new = function(x,y,z) return {X=x,Y=y,Z=z} end
            }
            UDim = {
                new = function(s,o) return {Scale=s,Offset=o} end
            }
            Enum = {
                Font = { GothamBold="GothamBold", Gotham="Gotham", Arial="Arial" },
                TextXAlignment = { Left="Left", Center="Center", Right="Right" },
                TextTruncate = { AtEnd="AtEnd", None="None" },
                ZIndexBehavior = { Sibling="Sibling", Global="Global" },
                KeyCode = { Space=57, E=18, Q=16 },
                UserInputType = { MouseButton1=0, MouseMoved=1, Touch=2 },
                NormalId = { Front=0, Back=1, Left=2, Right=3 },
            }
            TweenInfo = {
                new = function(t, style, dir, rep, rev, delay)
                    return { Time=t }
                end
            }
            math.huge = 1/0
        """)

        # TweenService stub
        lua.execute("""
            TweenService = {
                Create = function(self, inst, info, props)
                    return { Play = function(self) end }
                end
            }
        """)

        # MarketplaceService stub
        lua.execute(f"""
            MarketplaceService = {{
                GetProductInfo = function(self, placeId)
                    return {{ Name = "[PARK] Superstar Baseball" }}
                end
            }}
        """)

        # UserInputService stub
        lua.execute("""
            UserInputService = {
                TouchEnabled = false,
                KeyboardEnabled = true,
                InputChanged = { Connect = function(self, fn) end },
                InputBegan  = { Connect = function(self, fn) end },
                InputEnded  = { Connect = function(self, fn) end },
            }
        """)

        # pcall / type / tostring ya vienen en Lua, pero aseguramos table.unpack
        lua.execute("""
            if not table.unpack then table.unpack = unpack end
        """)

    def test_script(self, script_content, script_name="test_script.lua"):
        print(f"\n{'='*55}")
        print(f"  TESTING: {script_name}")
        print(f"{'='*55}")

        self._setup_globals()
        self.logs.clear()
        self.warnings.clear()
        self.errors.clear()

        try:
            self.lua.execute(script_content)
            status = "✅ PASS"
            error_msg = None
        except LuaError as e:
            status = "❌ FAIL"
            error_msg = str(e)
            self.errors.append(error_msg)
            print(f"\n  [error] {error_msg}")
        except Exception as e:
            status = "❌ FAIL (Python)"
            error_msg = str(e)
            self.errors.append(error_msg)
            print(f"\n  [error] {error_msg}")

        # Archivos escritos
        written = self.delta.get_written_files()

        print(f"\n{'-'*55}")
        print(f"  Resultado:  {status}")
        print(f"  Prints:     {len(self.logs)}")
        print(f"  Warnings:   {len(self.warnings)}")
        print(f"  Errores:    {len(self.errors)}")
        print(f"  Archivos:   {len(written)}")
        if written:
            for f in written[:10]:
                print(f"    - {f}")
            if len(written) > 10:
                print(f"    ... y {len(written)-10} más")
        print(f"{'='*55}\n")

        return {
            "script": script_name,
            "status": status,
            "passed": error_msg is None,
            "logs": self.logs,
            "warnings": self.warnings,
            "errors": self.errors,
            "files_written": written,
            "error_msg": error_msg,
        }

    def test_file(self, path):
        content = Path(path).read_text(encoding="utf-8")
        return self.test_script(content, Path(path).name)


# =============================================
# MAIN
# =============================================

if __name__ == "__main__":
    tester = RobloxScriptTester()

    # Si se pasa un archivo por argumento
    if len(sys.argv) > 1:
        result = tester.test_file(sys.argv[1])
        sys.exit(0 if result["passed"] else 1)

    # Por defecto testea el dumper.lua
    dumper_path = Path(__file__).parent / "dumper.lua"
    if dumper_path.exists():
        result = tester.test_file(str(dumper_path))
    else:
        print("No se encontró dumper.lua, corriendo test básico...")
        result = tester.test_script("""
print("Hola desde el simulador!")
warn("Esto es un warning")
local t = Instance.new("Frame")
t.Name = "TestFrame"
print("ClassName:", t.ClassName)
print("Test completado")
""", "basic_test.lua")

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

        # ReplicatedStorage con estructura SMB real
        rs = self._make("ReplicatedStorage", "ReplicatedStorage")
        smb = self._make("Folder", "SMB", rs)
        remotes = self._make("Folder", "Remotes", smb)
        self._make("RemoteEvent", "Bateo", remotes)
        self._make("RemoteEvent", "ABS", remotes)
        self._make("RemoteEvent", "Zona", remotes)
        # Módulos simulados con Source básico
        pelota_m = self._make("ModuleScript", "Pelota", smb)
        pelota_m.Source = "return { EnZona=function(x,y) return math.abs(x)<1.4 and y>1.5 and y<4.3 end, ZPlato=1.2, Salida=Vector3.new(1.5,6.2,55) }"
        bateo_m = self._make("ModuleScript", "Bateo", smb)
        bateo_m.Source = "return { contacto=function() return 0.9, true, 0 end }"
        config_m = self._make("ModuleScript", "Config", smb)
        config_m.Source = "return { BATEO={ VentanaContacto=0.3, RadioContacto=1.25, VentanaPerfecta=0.08, RadioPerfecto=0.5, VelocidadBase=120, VelocidadExtra=40, ElevacionBase=18, ElevacionPorStud=1.5, PerfectoVelocidad=15, PerfectoElevacion=8, DireccionMaxima=22, ContactoFuerte={Desde=0.7,Hasta=1,Velocidad=8,Elevacion=4} }, EQUIPO={ EfectoContacto=0.08, EfectoPoder=0.06 }, LANZAMIENTO={} }"

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

        # RunService stub
        lua.execute("""
            RunService = {
                RenderStepped = { Connect = function(self, fn) end },
                Heartbeat = { Connect = function(self, fn) end },
                Stepped = { Connect = function(self, fn) end },
                BindToRenderStep = function(self, name, prio, fn) end,
                UnbindFromRenderStep = function(self, name) end,
                IsClient = function(self) return true end,
                IsServer = function(self) return false end,
            }
        """)

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
            lua_services = {
                "MarketplaceService", "TweenService", "UserInputService",
                "Players", "ReplicatedStorage", "Workspace", "RunService"
            }
            if name in lua_services:
                try:
                    result = lua.eval(name)
                    if result is not None:
                        return result
                except:
                    pass
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

        # WaitForChild en game directamente
        def wait_for_child(_, name, timeout=None):
            # Buscar en servicios
            svc = game_sim.GetService(name)
            if svc:
                t = lua.table()
                t.Name = svc.Name
                t.ClassName = svc.ClassName
                def wfc_inner(_, n, to=None):
                    child = svc.FindFirstChild(n)
                    if child:
                        ct = lua.table()
                        ct.Name = child.Name
                        ct.ClassName = child.ClassName
                        ct.Source = child.Source
                        def wfc2(_, n2, to2=None): return lua.table()
                        ct.WaitForChild = wfc2
                        ct.FindFirstChild = lambda _, n2: None
                        ct.GetAttribute = lambda _, k: None
                        ct.SetAttribute = lambda _, k, v: None
                        ct.GetChildren = lambda _: lua.table()
                        ct.GetDescendants = lambda _: lua.table()
                        ct.IsA = lambda _, cn: cn == child.ClassName
                        ct.OnClientEvent = lua.table()
                        ct.OnClientEvent.Connect = lambda _, fn: None
                        ct.FireServer = lambda _, *a: None
                        return ct
                    return lua.table()
                t.WaitForChild = wfc_inner
                t.FindFirstChild = lambda _, n: None
                t.GetAttribute = lambda _, k: None
                t.SetAttribute = lambda _, k, v: None
                return t
            return lua.table()
        g.game.WaitForChild = wait_for_child

        # ReplicatedStorage con SMB simulado en Lua
        lua.execute("""
            ReplicatedStorage = {
                Name = "ReplicatedStorage",
                ClassName = "ReplicatedStorage",
                WaitForChild = function(self, name, timeout)
                    if name == "SMB" then
                        return {
                            Name = "SMB",
                            WaitForChild = function(self2, n, t)
                                local stubs = {
                                    Pelota = { Name="Pelota", ClassName="ModuleScript" },
                                    Bateo  = { Name="Bateo",  ClassName="ModuleScript" },
                                    Config = { Name="Config", ClassName="ModuleScript" },
                                    Remotes = {
                                        Name="Remotes", ClassName="Folder",
                                        WaitForChild = function(self3, n2, t2)
                                            return {
                                                Name=n2, ClassName="RemoteEvent",
                                                OnClientEvent = { Connect = function(self4, fn) end },
                                                FireServer = function(self4, ...) end,
                                                IsA = function(self4, cn) return cn == "RemoteEvent" end,
                                                FindFirstChild = function(self4, n3) return nil end,
                                            }
                                        end,
                                        FindFirstChild = function(self3, n2)
                                            return {
                                                Name=n2, ClassName="RemoteEvent",
                                                OnClientEvent = { Connect = function(self4, fn) end },
                                                FireServer = function(self4, ...) end,
                                                IsA = function(self4, cn) return cn == "RemoteEvent" end,
                                            }
                                        end,
                                    },
                                }
                                local s = stubs[n]
                                if s then
                                    if not s.WaitForChild then
                                        s.WaitForChild = function(self3, n2, t2)
                                            return { Name=n2, ClassName="ModuleScript", WaitForChild=function() return {} end }
                                        end
                                    end
                                    if not s.GetAttribute then s.GetAttribute = function() return nil end end
                                    if not s.SetAttribute then s.SetAttribute = function() end end
                                    return s
                                end
                                return { Name=n, WaitForChild=function() return {} end, GetAttribute=function() return nil end, SetAttribute=function() end, FindFirstChild=function() return nil end }
                            end,
                            FindFirstChild = function(self2, n)
                                return nil
                            end,
                            GetAttribute = function(self2, k) return nil end,
                            SetAttribute = function(self2, k, v) end,
                        }
                    end
                    return { Name=name, WaitForChild=function() return {} end, FindFirstChild=function() return nil end, GetAttribute=function() return nil end }
                end,
                FindFirstChild = function(self, name) return nil end,
            }
        """)
        lua.execute("""
            Players = {
                LocalPlayer = {
                    Name = "TestPlayer",
                    UserId = 12345,
                    Team = nil,
                    PlayerGui = {
                        Name = "PlayerGui", ClassName = "PlayerGui",
                        WaitForChild = function(self, n, t) return { Name=n } end,
                        FindFirstChild = function(self, n) return nil end,
                        GetChildren = function(self) return {} end,
                    },
                    Character = {
                        Name = "Character",
                        FindFirstChild = function(self, n)
                            if n == "HumanoidRootPart" then
                                return { Position = Vector3.new(0,5,0), ClassName="Part" }
                            end
                            return nil
                        end,
                        FindFirstChildOfClass = function(self, cn) return nil end,
                    },
                    WaitForChild = function(self, n, t)
                        if self[n] then return self[n] end
                        return { Name=n, GetChildren=function() return {} end }
                    end,
                    GetAttribute = function(self, k) return nil end,
                    SetAttribute = function(self, k, v) end,
                    GetAttributeChangedSignal = function(self, k)
                        return { Connect = function(self2, fn) end }
                    end,
                },
                GetPlayers = function(self) return {} end,
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

        # Enum stubs ampliados
        lua.execute("""
            Enum = {
                Font = { GothamBold="GothamBold", Gotham="Gotham", Arial="Arial", GothamBlack="GothamBlack", GothamMedium="GothamMedium" },
                TextXAlignment = { Left="Left", Center="Center", Right="Right" },
                TextYAlignment = { Top="Top", Center="Center", Bottom="Bottom" },
                TextTruncate = { AtEnd="AtEnd", None="None" },
                ZIndexBehavior = { Sibling="Sibling", Global="Global" },
                KeyCode = { Space=57, E=18, Q=16, C=46, ButtonY=0 },
                UserInputType = { MouseButton1=0, MouseMovement=1, Touch=2, MouseButton2=3 },
                NormalId = { Front=0, Back=1, Left=2, Right=3 },
                EasingStyle = { Quad=0, Back=1, Linear=2 },
                EasingDirection = { Out=0, In=1, InOut=2 },
                FillDirection = { Vertical=0, Horizontal=1 },
                HorizontalAlignment = { Center=0, Left=1, Right=2 },
                VerticalAlignment = { Center=0, Top=1, Bottom=2 },
                SortOrder = { LayoutOrder=0, Name=1 },
                CameraType = { Custom=0, Scriptable=1 },
                Material = { Neon=0, SmoothPlastic=1 },
                PartType = { Ball=0, Cylinder=1, Block=2 },
                RaycastFilterType = { Exclude=0, Include=1 },
                RenderPriority = { Last = { Value = 500 } },
                ScaleType = { Fit=0, Crop=1, Stretch=2 },
                ApplyStrokeMode = { Border=0, Contextual=1 },
                InfoType = { GamePass=0, Asset=1 },
                SurfaceGuiSizingMode = { FixedSize=0, PixelsPerStud=1 },
            }
            TweenInfo = {
                new = function(t, style, dir, rep, rev, delay)
                    return { Time=t }
                end
            }
            math.huge = 1/0
        """)

        # UDim2, Color3, Vector3, UDim stubs
        lua.execute("""
            UDim2 = {}
            UDim2.new = function(xs, xo, ys, yo)
                return { X={Scale=xs,Offset=xo}, Y={Scale=ys,Offset=yo} }
            end
            UDim2.fromOffset = function(x, y)
                return UDim2.new(0, x, 0, y)
            end
            UDim2.fromScale = function(x, y)
                return UDim2.new(x, 0, y, 0)
            end
            Color3 = {
                fromRGB = function(r,g,b) return {R=r/255,G=g/255,B=b/255} end,
                new = function(r,g,b) return {R=r,G=g,B=b} end,
            }
            Vector3 = {
                new = function(x,y,z) return {X=x or 0,Y=y or 0,Z=z or 0, Magnitude=math.sqrt((x or 0)^2+(y or 0)^2+(z or 0)^2)} end
            }
            Vector2 = {
                new = function(x,y) return {X=x or 0,Y=y or 0, Magnitude=math.sqrt((x or 0)^2+(y or 0)^2)} end
            }
            UDim = {
                new = function(s,o) return {Scale=s,Offset=o} end
            }
            CFrame = {
                new = function(x,y,z) return {X=x,Y=y,Z=z} end,
                lookAt = function(a,b) return {from=a,to=b} end,
                Angles = function(x,y,z) return {rx=x,ry=y,rz=z} end,
            }
            ColorSequence = {
                new = function(a, b)
                    if b then return {c1=a,c2=b}
                    else return {colors=a} end
                end
            }
            ColorSequenceKeypoint = {
                new = function(t,c) return {time=t,color=c} end
            }
            NumberSequence = {
                new = function(a,b) return {a=a,b=b} end
            }
            RaycastParams = {
                new = function()
                    return {
                        FilterType = nil,
                        FilterDescendantsInstances = {}
                    }
                end
            }
        """)
        lua.execute("""
            TweenService = {
                Create = function(self, inst, info, props)
                    return { Play = function(self2) end }
                end
            }
        """)

        # workspace stub
        lua.execute("""
            workspace = {
                Name = "Workspace",
                ClassName = "Workspace",
                CurrentCamera = {
                    Name = "Camera",
                    ClassName = "Camera",
                    ViewportSize = Vector2.new(1920, 1080),
                    CFrame = CFrame.new(0,10,-20),
                    CameraType = "Custom",
                    FieldOfView = 70,
                    CameraSubject = nil,
                    WaitForChild = function(self, n, t) return nil end,
                    FindFirstChild = function(self, n) return nil end,
                    GetChildren = function(self) return {} end,
                    GetDescendants = function(self) return {} end,
                    GetPropertyChangedSignal = function(self, p)
                        return { Connect = function(self2, fn) end }
                    end,
                    WorldToViewportPoint = function(self, pos)
                        return Vector3.new(960, 540, 1), true
                    end,
                    PointToObjectSpace = function(self, pos)
                        return Vector3.new(0, 0, -10)
                    end,
                },
                GetServerTimeNow = function(self) return os.clock() end,
                FindFirstChild = function(self, n) return nil end,
                WaitForChild = function(self, n, t) return nil end,
                GetChildren = function(self) return {} end,
                GetDescendants = function(self) return {} end,
                Raycast = function(self, origin, dir, params) return nil end,
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
                GamepadEnabled = false,
                MouseIconEnabled = true,
                InputChanged = { Connect = function(self, fn) end },
                InputBegan  = { Connect = function(self, fn) end },
                InputEnded  = { Connect = function(self, fn) end },
                GetMouseLocation = function(self) return Vector2.new(0,0) end,
            }
        """)

        # require simulado para ModuleScripts de SMB
        lua.execute("""
            local _origRequire = require
            require = function(mod)
                if type(mod) ~= "table" then return _origRequire(mod) end
                local name = mod.Name or ""
                if name == "Pelota" then
                    return {
                        EnZona = function(x, y) return math.abs(x)<1.4 and y>1.5 and y<4.3 end,
                        ZPlato = 1.2, ZGuante = -3.6,
                        Salida = Vector3.new(1.5, 6.2, 55),
                        Zona = { xMin=-1.4, xMax=1.4, yMin=1.5, yMax=4.3 },
                        RadioVisual = 0.3, RadioBola = 0.3,
                        Lanzamientos = {
                            Recta  = { mph=94, T=0.62, quiebre=Vector2.new(0.25,-0.8) },
                            Sinker = { mph=91, T=0.65, quiebre=Vector2.new(1.2,-1.8) },
                            Slider = { mph=85, T=0.70, quiebre=Vector2.new(-1.5,-1.6) },
                            Curva  = { mph=77, T=0.79, quiebre=Vector2.new(-0.7,-3.1) },
                            Cambio = { mph=83, T=0.72, quiebre=Vector2.new(0.9,-2.1) },
                        },
                        Orden = {"Recta","Sinker","Slider","Curva","Cambio"},
                        Pos = function(lanz, t)
                            local v = math.clamp((t - lanz.inicio) / lanz.T, 0, 1)
                            return lanz.p0
                        end,
                        HoraGuante = function(lanz) return lanz.inicio + lanz.T end,
                        DistanciaZona = function(x,y) return 0 end,
                        EsFair = function(pos) return true end,
                        Horizontal = function(pos) return 100 end,
                        Angulo = function(pos) return 0 end,
                        Simular = function(pos, vel) return { puntos={pos}, aterrizaje=pos, evento="Suelo", duracion=3, final=pos } end,
                    }
                elseif name == "Bateo" then
                    return {
                        contacto = function(lanz, swing, q) return 0.9, true, 0 end,
                        batear = function(...) return { puntos={}, aterrizaje=Vector3.new(0,0,100), evento="Suelo", duracion=3, final=Vector3.new(0,0,100) }, 25, 85 end,
                        SWING = { Normal={ventana=1,alcance=1,fuerza=1}, Poder={ventana=0.72,alcance=0.78,fuerza=1.12}, Toque={ventana=2.4,alcance=1.1,fuerza=0} },
                    }
                elseif name == "Config" then
                    return {
                        BATEO = {
                            VentanaContacto=0.3, RadioContacto=1.25,
                            VentanaPerfecta=0.08, RadioPerfecto=0.5,
                            VelocidadBase=120, VelocidadExtra=40,
                            ElevacionBase=18, ElevacionPorStud=1.5,
                            PerfectoVelocidad=15, PerfectoElevacion=8,
                            DireccionMaxima=22, AbiertoDesde=15, AbiertoPerdida=0.0055,
                            ContactoFuerte={Desde=0.7,Hasta=1,Velocidad=8,Elevacion=4},
                        },
                        EQUIPO = { EfectoContacto=0.08, EfectoPoder=0.06 },
                        LANZAMIENTO = {},
                    }
                end
                return {}
            end
        """)
        lua.execute("""
            if not table.unpack then table.unpack = unpack end
            math.clamp = math.clamp or function(v, lo, hi) return math.max(lo, math.min(hi, v)) end
            math.sign  = math.sign  or function(v) return v > 0 and 1 or v < 0 and -1 or 0 end
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

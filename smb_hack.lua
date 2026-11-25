-- ============================================================
--   SÚPER MEGA BATEADOR - SCRIPT
--   Auto Swing · Pitch Predictor · Field Tracker · Panel Pro
-- ============================================================

local Players        = game:GetService("Players")
local RunService     = game:GetService("RunService")
local TweenService   = game:GetService("TweenService")
local UIS            = game:GetService("UserInputService")
local LP             = Players.LocalPlayer

-- ── Esperar recursos del juego ────────────────────────────
local SMB      = game:GetService("ReplicatedStorage"):WaitForChild("SMB", 15)
if not SMB then warn("[SMB] ReplicatedStorage.SMB no encontrado"); return end

local Remotes  = SMB:WaitForChild("Remotes", 10)
local Pelota   = require(SMB:WaitForChild("Pelota"))
local Bateo    = require(SMB:WaitForChild("Bateo"))
local Config   = require(SMB:WaitForChild("Config"))

local CFG_BAT  = Config.BATEO or {}
local CAM      = workspace.CurrentCamera

-- ── Colores del panel ────────────────────────────────────
local C = {
    bg       = Color3.fromRGB(10,  13,  22),
    panel    = Color3.fromRGB(14,  18,  30),
    header   = Color3.fromRGB(18,  24,  40),
    border   = Color3.fromRGB(50,  65, 100),
    accent   = Color3.fromRGB(80, 160, 255),
    accent2  = Color3.fromRGB(236, 62, 196),
    green    = Color3.fromRGB(50,  220, 130),
    yellow   = Color3.fromRGB(244, 196,  72),
    red      = Color3.fromRGB(235,  55,  55),
    white    = Color3.fromRGB(230, 236, 250),
    muted    = Color3.fromRGB(120, 135, 165),
    dark     = Color3.fromRGB( 6,   8,  15),
}

-- ── Estado global ─────────────────────────────────────────
local State = {
    autoSwing   = false,
    pitchPredict= true,
    fieldTrack  = true,
    lanzActual  = nil,   -- datos del lanzamiento en curso
    marcaParte  = nil,   -- Part de la marca de caída
    flechaActive= false,
    posicion    = nil,   -- posicion del jugador (Pitcher, RightField, etc.)
    visible     = true,
}

-- ============================================================
--  HELPERS UI
-- ============================================================
local function corner(r, p)
    local c = Instance.new("UICorner"); c.CornerRadius = UDim.new(0,r); c.Parent = p
end
local function stroke(col, th, tr, p)
    local s = Instance.new("UIStroke")
    s.Color = col; s.Thickness = th; s.Transparency = tr or 0; s.Parent = p
end
local function gradient(c1, c2, rot, p)
    local g = Instance.new("UIGradient")
    g.Color = ColorSequence.new(c1, c2)
    g.Rotation = rot or 90; g.Parent = p
end
local function label(props, parent)
    local l = Instance.new("TextLabel")
    l.BackgroundTransparency = 1
    l.Font = Enum.Font.GothamBold
    l.TextColor3 = C.white
    l.TextSize = 13
    for k,v in pairs(props) do l[k] = v end
    l.Parent = parent
    return l
end
local function tween(obj, t, props)
    TweenService:Create(obj, TweenInfo.new(t, Enum.EasingStyle.Quad), props):Play()
end

-- ============================================================
--  CONSTRUIR PANEL
-- ============================================================
local Gui = Instance.new("ScreenGui")
Gui.Name            = "SMB_Hack"
Gui.ResetOnSpawn    = false
Gui.IgnoreGuiInset  = true
Gui.DisplayOrder    = 50
Gui.Parent          = LP:WaitForChild("PlayerGui")

-- Escala adaptada al tamaño de pantalla
local Scale = Instance.new("UIScale"); Scale.Parent = Gui
local function ajustarEscala()
    local vp = CAM.ViewportSize
    Scale.Scale = math.clamp(math.min(vp.X/420, vp.Y/560), 0.55, 1)
end
ajustarEscala()
CAM:GetPropertyChangedSignal("ViewportSize"):Connect(ajustarEscala)

-- ── Marco principal ───────────────────────────────────────
local Main = Instance.new("Frame")
Main.Name              = "Main"
Main.AnchorPoint       = Vector2.new(0, 0.5)
Main.Position          = UDim2.new(0, 10, 0.5, 0)
Main.Size              = UDim2.fromOffset(210, 340)
Main.BackgroundColor3  = C.panel
Main.BorderSizePixel   = 0
Main.ClipsDescendants  = true
Main.Parent            = Gui
corner(14, Main)
stroke(C.border, 1.5, 0.3, Main)

-- Degradado de fondo semi-transparente
local bgGrad = Instance.new("Frame")
bgGrad.Size = UDim2.fromScale(1,1)
bgGrad.BackgroundColor3 = C.dark
bgGrad.BackgroundTransparency = 0.15
bgGrad.BorderSizePixel = 0
bgGrad.Parent = Main
corner(14, bgGrad)
gradient(C.bg, Color3.fromRGB(18,28,52), 135, bgGrad)

-- ── Header ────────────────────────────────────────────────
local Header = Instance.new("Frame")
Header.Size            = UDim2.new(1, 0, 0, 44)
Header.BackgroundColor3= C.header
Header.BorderSizePixel = 0
Header.Parent          = Main
corner(14, Header)
-- borde inferior del header (fix de esquinas redondeadas)
local hBot = Instance.new("Frame")
hBot.Size = UDim2.new(1,0,0,8)
hBot.Position = UDim2.new(0,0,1,-8)
hBot.BackgroundColor3 = C.header
hBot.BorderSizePixel = 0
hBot.Parent = Header
-- línea de acento degradada en header
local hLine = Instance.new("Frame")
hLine.Size = UDim2.new(1,0,0,2)
hLine.Position = UDim2.new(0,0,1,-1)
hLine.BackgroundColor3 = C.accent
hLine.BorderSizePixel = 0
hLine.Parent = Header
gradient(C.accent, C.accent2, 0, hLine)

label({
    Text = "⚾  SMB HACK",
    Position = UDim2.new(0, 14, 0, 0),
    Size = UDim2.new(1, -50, 1, 0),
    TextXAlignment = Enum.TextXAlignment.Left,
    Font = Enum.Font.GothamBlack,
    TextSize = 15,
    TextColor3 = C.white,
}, Header)

-- Botón minimizar
local MinBtn = Instance.new("TextButton")
MinBtn.Size = UDim2.fromOffset(28, 28)
MinBtn.Position = UDim2.new(1, -36, 0.5, -14)
MinBtn.BackgroundColor3 = C.border
MinBtn.Text = "−"
MinBtn.Font = Enum.Font.GothamBlack
MinBtn.TextSize = 18
MinBtn.TextColor3 = C.white
MinBtn.BorderSizePixel = 0
MinBtn.Parent = Header
corner(8, MinBtn)

-- ── Contenido ─────────────────────────────────────────────
local Content = Instance.new("Frame")
Content.Position = UDim2.new(0, 0, 0, 44)
Content.Size = UDim2.new(1, 0, 1, -44)
Content.BackgroundTransparency = 1
Content.Parent = Main

local Layout = Instance.new("UIListLayout")
Layout.FillDirection = Enum.FillDirection.Vertical
Layout.Padding = UDim.new(0, 6)
Layout.Parent = Content
local Pad = Instance.new("UIPadding")
Pad.PaddingLeft = UDim.new(0,10)
Pad.PaddingRight = UDim.new(0,10)
Pad.PaddingTop = UDim.new(0,8)
Pad.Parent = Content

-- ── Función para crear fila de toggle ──────────────────────
local function makeToggle(icon, name, state, onChange)
    local Row = Instance.new("Frame")
    Row.Size = UDim2.new(1, 0, 0, 36)
    Row.BackgroundColor3 = C.header
    Row.BorderSizePixel = 0
    Row.Parent = Content
    corner(8, Row)
    stroke(C.border, 1, 0.6, Row)

    label({
        Text = icon .. "  " .. name,
        Position = UDim2.new(0, 10, 0, 0),
        Size = UDim2.new(1, -58, 1, 0),
        TextXAlignment = Enum.TextXAlignment.Left,
        TextSize = 13,
    }, Row)

    -- Toggle pill
    local Pill = Instance.new("Frame")
    Pill.AnchorPoint = Vector2.new(1, 0.5)
    Pill.Position = UDim2.new(1, -10, 0.5, 0)
    Pill.Size = UDim2.fromOffset(40, 22)
    Pill.BorderSizePixel = 0
    Pill.Parent = Row
    corner(11, Pill)

    local Dot = Instance.new("Frame")
    Dot.Size = UDim2.fromOffset(16, 16)
    Dot.AnchorPoint = Vector2.new(0.5, 0.5)
    Dot.Position = UDim2.new(0, state and 30 or 12, 0.5, 0)
    Dot.BackgroundColor3 = C.white
    Dot.BorderSizePixel = 0
    Dot.Parent = Pill
    corner(8, Dot)

    local function refresh(val)
        Pill.BackgroundColor3 = val and C.green or C.border
        tween(Dot, 0.15, { Position = UDim2.new(0, val and 30 or 12, 0.5, 0) })
    end
    refresh(state)

    local btn = Instance.new("TextButton")
    btn.Size = UDim2.fromScale(1,1)
    btn.BackgroundTransparency = 1
    btn.Text = ""
    btn.Parent = Row
    btn.MouseButton1Click:Connect(function()
        state = not state
        refresh(state)
        onChange(state)
    end)

    return Row, function() return state end
end

-- ── Toggles ───────────────────────────────────────────────
makeToggle("🏏", "Auto Swing", State.autoSwing, function(v)
    State.autoSwing = v
end)
makeToggle("🎯", "Pitch Predictor", State.pitchPredict, function(v)
    State.pitchPredict = v
    if not v and State.marcaParte then
        State.marcaParte.Transparency = 1
    end
end)
makeToggle("🧤", "Field Tracker", State.fieldTrack, function(v)
    State.fieldTrack = v
end)

-- ── Separador ──────────────────────────────────────────────
local Sep = Instance.new("Frame")
Sep.Size = UDim2.new(1, 0, 0, 1)
Sep.BackgroundColor3 = C.border
Sep.BackgroundTransparency = 0.5
Sep.BorderSizePixel = 0
Sep.Parent = Content

-- ── Bloque de info de pelota ───────────────────────────────
local InfoBox = Instance.new("Frame")
InfoBox.Size = UDim2.new(1, 0, 0, 86)
InfoBox.BackgroundColor3 = C.header
InfoBox.BorderSizePixel = 0
InfoBox.Parent = Content
corner(8, InfoBox)
stroke(C.border, 1, 0.6, InfoBox)

local lbTitulo = label({
    Text = "PELOTA",
    Position = UDim2.new(0, 10, 0, 6),
    Size = UDim2.new(1, -20, 0, 16),
    TextXAlignment = Enum.TextXAlignment.Left,
    TextSize = 10,
    TextColor3 = C.muted,
    Font = Enum.Font.GothamBold,
}, InfoBox)

local lbTipo = label({
    Text = "—",
    Position = UDim2.new(0, 10, 0, 22),
    Size = UDim2.new(0.6, -10, 0, 22),
    TextXAlignment = Enum.TextXAlignment.Left,
    TextSize = 20,
    Font = Enum.Font.GothamBlack,
    TextColor3 = C.accent,
}, InfoBox)

local lbMph = label({
    Text = "— mph",
    Position = UDim2.new(0.6, 0, 0, 22),
    Size = UDim2.new(0.4, -10, 0, 22),
    TextXAlignment = Enum.TextXAlignment.Right,
    TextSize = 20,
    Font = Enum.Font.GothamBlack,
    TextColor3 = C.yellow,
}, InfoBox)

local lbTiempo = label({
    Text = "Llegada: —",
    Position = UDim2.new(0, 10, 0, 46),
    Size = UDim2.new(1, -20, 0, 16),
    TextXAlignment = Enum.TextXAlignment.Left,
    TextSize = 12,
    TextColor3 = C.muted,
}, InfoBox)

local lbPosicion = label({
    Text = "Posición: —",
    Position = UDim2.new(0, 10, 0, 64),
    Size = UDim2.new(1, -20, 0, 16),
    TextXAlignment = Enum.TextXAlignment.Left,
    TextSize = 12,
    TextColor3 = C.muted,
}, InfoBox)

-- ── Bloque de posición del jugador ─────────────────────────
local PosBox = Instance.new("Frame")
PosBox.Size = UDim2.new(1, 0, 0, 44)
PosBox.BackgroundColor3 = C.header
PosBox.BorderSizePixel = 0
PosBox.Parent = Content
corner(8, PosBox)
stroke(C.border, 1, 0.6, PosBox)

label({
    Text = "MI ROL",
    Position = UDim2.new(0, 10, 0, 4),
    Size = UDim2.new(1, -20, 0, 14),
    TextXAlignment = Enum.TextXAlignment.Left,
    TextSize = 10,
    TextColor3 = C.muted,
}, PosBox)

local lbRol = label({
    Text = "Espectador",
    Position = UDim2.new(0, 10, 0, 18),
    Size = UDim2.new(1, -20, 0, 20),
    TextXAlignment = Enum.TextXAlignment.Left,
    TextSize = 14,
    Font = Enum.Font.GothamBlack,
    TextColor3 = C.green,
}, PosBox)

-- ── Draggable ─────────────────────────────────────────────
do
    local drag, ds, sp = false
    Header.InputBegan:Connect(function(i)
        if i.UserInputType == Enum.UserInputType.MouseButton1 or
           i.UserInputType == Enum.UserInputType.Touch then
            drag = true; ds = i.Position; sp = Main.Position
        end
    end)
    Header.InputEnded:Connect(function(i)
        if i.UserInputType == Enum.UserInputType.MouseButton1 or
           i.UserInputType == Enum.UserInputType.Touch then
            drag = false
        end
    end)
    UIS.InputChanged:Connect(function(i)
        if drag and (i.UserInputType == Enum.UserInputType.MouseMovement or
                     i.UserInputType == Enum.UserInputType.Touch) then
            local d = i.Position - ds
            Main.Position = UDim2.new(
                sp.X.Scale, sp.X.Offset + d.X,
                sp.Y.Scale, sp.Y.Offset + d.Y)
        end
    end)
end

-- ── Minimizar ─────────────────────────────────────────────
local minimized = false
MinBtn.MouseButton1Click:Connect(function()
    minimized = not minimized
    MinBtn.Text = minimized and "+" or "−"
    tween(Main, 0.2, { Size = minimized
        and UDim2.fromOffset(210, 44)
        or  UDim2.fromOffset(210, 340) })
end)

-- ============================================================
--  MARCA DE CAÍDA (Pitch Predictor)
-- ============================================================
local function crearMarca()
    if State.marcaParte then State.marcaParte:Destroy() end
    local folder = CAM:FindFirstChild("SMB_Local") or CAM
    local p = Instance.new("Part")
    p.Name = "MarcaSMB"
    p.Anchored = true
    p.CanCollide = false; p.CanQuery = false; p.CanTouch = false
    p.CastShadow = false
    p.Shape = Enum.PartType.Cylinder
    p.Size = Vector3.new(0.1, 1.2, 1.2)
    p.Material = Enum.Material.Neon
    p.Color = C.accent
    p.Transparency = 1
    p.Parent = folder

    -- aro exterior
    local sel = Instance.new("SelectionBox")
    sel.Adornee = p
    sel.Color3 = C.accent
    sel.LineThickness = 0.04
    sel.SurfaceTransparency = 1
    sel.Parent = p

    State.marcaParte = p
    return p
end
crearMarca()

local function mostrarMarca(pos, esStrike)
    if not State.pitchPredict or not State.marcaParte then return end
    local p = State.marcaParte
    p.CFrame = CFrame.new(pos) * CFrame.Angles(0, 0, math.pi/2)
    p.Color = esStrike and C.green or C.red
    p.Transparency = 0.3
    local sel = p:FindFirstChildOfClass("SelectionBox")
    if sel then sel.Color3 = p.Color end
end

local function ocultarMarca()
    if State.marcaParte then
        State.marcaParte.Transparency = 1
    end
end

-- ============================================================
--  LEER LANZAMIENTO ACTUAL
-- ============================================================
-- El juego guarda los datos del lanzamiento en el LocalPlayer
-- como atributos cuando empieza el duelo.
local function getLanzamiento()
    -- Intentar leer de la carpeta SMB_Local en la cámara
    local folder = CAM:FindFirstChild("SMB_Local")
    if not folder then return nil end

    -- El lanzamiento viene como atributos del folder
    local p0 = folder:GetAttribute("p0")
    local pT = folder:GetAttribute("pT")
    local B  = folder:GetAttribute("B")
    local inicio = folder:GetAttribute("inicio")
    local tipo   = folder:GetAttribute("tipo")
    local mph    = folder:GetAttribute("mph")
    local T      = folder:GetAttribute("T")

    if not (p0 and pT and B and inicio) then return nil end

    return {
        p0 = p0, pT = pT, B = B,
        inicio = inicio, tipo = tipo or "Recta",
        mph = mph or 94, T = T or 0.62
    }
end

-- ============================================================
--  AUTO SWING
-- ============================================================
local swingRemote = Remotes and Remotes:FindFirstChild("Bateo")

local function hacerSwing(lanz)
    if not swingRemote then return end
    -- Calcular mejor posición para el swing basado en pT
    local x = lanz.pT.X
    local y = lanz.pT.Y
    local enZona = Pelota.EnZona(x, y)
    local tipo = "Normal"
    -- Si está en la zona, usar Poder para más distancia
    if enZona then tipo = "Poder" end

    swingRemote:FireServer({
        x      = x,
        y      = y,
        tipo   = tipo,
        zurdo  = false,
        dt     = 0,       -- timing perfecto
    })
end

-- ============================================================
--  LOOP PRINCIPAL (RenderStepped)
-- ============================================================
local lastLanzId = nil
local swingScheduled = false

RunService.RenderStepped:Connect(function()
    -- ── Actualizar posición del jugador ───────────────────
    local posAttr = LP:GetAttribute("Posicion")
    local equipo  = LP:GetAttribute("Equipo")
    local esBater = LP:GetAttribute("EsBateador") == true
    local fase    = LP:GetAttribute("FaseDuelo")

    -- Determinar rol legible
    local rolTexto = "Lobby"
    local rolColor = C.muted
    if posAttr then
        local nombres = {
            Pitcher    = "🏃 Lanzador",
            Primera    = "1️⃣ Primera Base",
            Segunda    = "2️⃣ Segunda Base",
            Tercera    = "3️⃣ Tercera Base",
            CortoParo  = "⚡ Parador en corto",
            Izquierdo  = "⬅ Left Field",
            Central    = "⬆ Center Field",
            Derecho    = "➡ Right Field",
            Receptor   = "🧤 Receptor",
            Designado  = "🏏 Bateador",
        }
        rolTexto = nombres[posAttr] or posAttr
        rolColor = esBater and C.accent or C.green
    end
    if LP:GetAttribute("Espectar") then
        rolTexto = "👁 Espectador"
        rolColor = C.muted
    end
    lbRol.Text = rolTexto
    lbRol.TextColor3 = rolColor

    -- ── Leer lanzamiento ──────────────────────────────────
    local lanz = getLanzamiento()

    if lanz then
        local ahora = workspace:GetServerTimeNow()
        local tRestante = (lanz.inicio + lanz.T) - ahora

        -- Actualizar UI de pelota
        lbTipo.Text  = lanz.tipo or "—"
        lbMph.Text   = (lanz.mph or "—") .. " mph"

        if tRestante > 0 then
            lbTiempo.Text = string.format("Llegada: %.2fs", tRestante)
            lbTiempo.TextColor3 = tRestante < 0.2 and C.red or
                                   tRestante < 0.4 and C.yellow or C.green
        else
            lbTiempo.Text = "Llegada: ya llegó"
            lbTiempo.TextColor3 = C.muted
        end

        local esStrike = Pelota.EnZona(lanz.pT.X, lanz.pT.Y)
        lbPosicion.Text = "Zona: " .. (esStrike and "✅ STRIKE" or "❌ BOLA")
        lbPosicion.TextColor3 = esStrike and C.green or C.red

        -- Mostrar marca de caída
        mostrarMarca(lanz.pT, esStrike)

        -- Auto Swing: si es bateador y la pelota está cerca
        if State.autoSwing and esBater and fase == "Batazo" then
            if not swingScheduled then
                swingScheduled = true
                -- Swing 1 frame antes del momento perfecto
                local delay = math.max(tRestante - 0.05, 0)
                task.delay(delay, function()
                    swingScheduled = false
                    if State.autoSwing and LP:GetAttribute("FaseDuelo") == "Batazo" then
                        hacerSwing(lanz)
                    end
                end)
            end
        end

    else
        -- Sin lanzamiento activo
        if lbTipo.Text ~= "—" then
            lbTipo.Text  = "—"
            lbMph.Text   = "— mph"
            lbTiempo.Text = "Esperando lanzamiento..."
            lbTiempo.TextColor3 = C.muted
            lbPosicion.Text = ""
            swingScheduled = false
            ocultarMarca()
        end
    end

    -- ── Field Tracker: flecha hacia la pelota ─────────────
    if State.fieldTrack then
        local folder = CAM:FindFirstChild("SMB_Local")
        local pelotaPart = folder and folder:FindFirstChild("Pelota")
        local marcaPart  = folder and folder:FindFirstChild("MarcaCaida")
        local target = (marcaPart and marcaPart.Transparency < 1 and marcaPart)
                    or (pelotaPart and pelotaPart.Transparency < 1 and pelotaPart)

        -- Solo mostrar si eres defensa y no estás bateando
        local esDefensa = posAttr and posAttr ~= "Designado" and not esBater
        if target and esDefensa and not LP:GetAttribute("CamRepeticion") then
            local char = LP.Character
            local hrp  = char and char:FindFirstChild("HumanoidRootPart")
            if hrp then
                local dist = (target.Position - hrp.Position).Magnitude
                -- El juego ya tiene su propio sistema de flechas (SMB_Flechas)
                -- Solo actualizamos el label de distancia
                lbPosicion.Text = string.format("Pelota: %.1f studs", dist)
                lbPosicion.TextColor3 = dist < 20 and C.yellow or C.muted
            end
        end
    end
end)

-- ============================================================
--  ESCUCHAR EVENTOS DEL SERVIDOR
-- ============================================================
-- El juego emite los datos del lanzamiento via RemoteEvent "Bateo"
-- al bateador cuando el pitcher lanza.
if Remotes then
    local bateoRemote = Remotes:FindFirstChild("Bateo")
    if bateoRemote and bateoRemote:IsA("RemoteEvent") then
        bateoRemote.OnClientEvent:Connect(function(data)
            if type(data) ~= "table" then return end
            -- El servidor manda los datos del lanzamiento
            if data.p0 and data.pT and data.B then
                State.lanzActual = data
                -- Guardar en atributos del folder para que el loop los lea
                local folder = CAM:FindFirstChild("SMB_Local")
                if folder then
                    folder:SetAttribute("p0",    data.p0)
                    folder:SetAttribute("pT",    data.pT)
                    folder:SetAttribute("B",     data.B)
                    folder:SetAttribute("inicio",data.inicio or workspace:GetServerTimeNow())
                    folder:SetAttribute("tipo",  data.tipo or "Recta")
                    folder:SetAttribute("mph",   data.mph or 94)
                    folder:SetAttribute("T",     data.T or 0.62)
                end
            end
        end)
    end
end

print("[SMB Hack] Cargado correctamente ✅")

-- ============================================================
--   SÚPER MEGA BATEADOR - SCRIPT
--   Auto Swing · Pitch Predictor · Field Tracker · Panel Pro
--   Basado en análisis del código fuente del juego
-- ============================================================

local Players      = game:GetService("Players")
local RunService   = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local UIS          = game:GetService("UserInputService")
local LP           = Players.LocalPlayer

-- ── Esperar recursos del juego ────────────────────────────
local SMB = game:GetService("ReplicatedStorage"):WaitForChild("SMB", 15)
if not SMB then warn("[SMB] No se encontró ReplicatedStorage.SMB"); return end

local Remotes  = SMB:WaitForChild("Remotes", 10)
local Pelota   = require(SMB:WaitForChild("Pelota"))
local Config   = require(SMB:WaitForChild("Config"))
local CFG_BAT  = Config.BATEO or {}
local CAM      = workspace.CurrentCamera

-- ── RemoteEvents reales del juego ─────────────────────────
-- Encontrados en SMB_Duelo.lua del cliente
local Remote_Lanzamiento = Remotes:WaitForChild("Lanzamiento", 10)
local Remote_Swing       = Remotes:WaitForChild("Swing", 10)

-- ── Colores ───────────────────────────────────────────────
local C = {
    bg      = Color3.fromRGB(10,  13,  22),
    panel   = Color3.fromRGB(14,  18,  30),
    header  = Color3.fromRGB(18,  24,  40),
    border  = Color3.fromRGB(50,  65, 100),
    accent  = Color3.fromRGB(80, 160, 255),
    accent2 = Color3.fromRGB(236, 62, 196),
    green   = Color3.fromRGB(50,  220, 130),
    yellow  = Color3.fromRGB(244, 196,  72),
    red     = Color3.fromRGB(235,  55,  55),
    white   = Color3.fromRGB(230, 236, 250),
    muted   = Color3.fromRGB(120, 135, 165),
    dark    = Color3.fromRGB(6,    8,  15),
}

-- ── Estado global ─────────────────────────────────────────
local State = {
    autoSwing    = false,
    pitchPredict = true,
    fieldTrack   = true,
    lanzActual   = nil,   -- datos del lanzamiento en curso (tabla del servidor)
    swingPendiente = false,
}

-- ── Variables del lanzamiento actual ──────────────────────
-- El servidor manda via Remotes.Lanzamiento.OnClientEvent
-- una tabla con: id, tipo, p0, pT, B, inicio, T, mph, perfecto, etc.
local lanzActual = nil
local swingUsado = {}  -- set de ids ya swingueados

-- ============================================================
--  ESCUCHAR LANZAMIENTO DEL SERVIDOR
-- ============================================================
if Remote_Lanzamiento then
    Remote_Lanzamiento.OnClientEvent:Connect(function(data)
        if type(data) ~= "table" then return end
        lanzActual = data
        -- Limpiar swing usado para este nuevo lanzamiento
        if data.id then
            swingUsado[data.id] = nil
        end
    end)
end

-- ============================================================
--  HELPERS UI
-- ============================================================
local function corner(r, p)
    local c = Instance.new("UICorner")
    c.CornerRadius = UDim.new(0, r); c.Parent = p
end
local function stroke(col, th, tr, p)
    local s = Instance.new("UIStroke")
    s.Color = col; s.Thickness = th
    s.Transparency = tr or 0; s.Parent = p
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
    for k, v in pairs(props) do l[k] = v end
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
Gui.Name           = "SMB_Hack"
Gui.ResetOnSpawn   = false
Gui.IgnoreGuiInset = true
Gui.DisplayOrder   = 50
Gui.Parent         = LP:WaitForChild("PlayerGui")

-- Escala adaptada al tamaño de pantalla (móvil/PC)
local Scale = Instance.new("UIScale")
Scale.Parent = Gui
local function ajustarEscala()
    local vp = CAM.ViewportSize
    Scale.Scale = math.clamp(math.min(vp.X / 420, vp.Y / 580), 0.52, 1)
end
ajustarEscala()
CAM:GetPropertyChangedSignal("ViewportSize"):Connect(ajustarEscala)

-- ── Marco principal ───────────────────────────────────────
local Main = Instance.new("Frame")
Main.Name             = "Main"
Main.AnchorPoint      = Vector2.new(0, 0.5)
Main.Position         = UDim2.new(0, 10, 0.5, 0)
Main.Size             = UDim2.fromOffset(215, 360)
Main.BackgroundColor3 = C.dark
Main.BorderSizePixel  = 0
Main.ClipsDescendants = true
Main.Parent           = Gui
corner(14, Main)
stroke(C.border, 1.5, 0.3, Main)

-- Fondo degradado semi-transparente
local bgFrame = Instance.new("Frame")
bgFrame.Size                = UDim2.fromScale(1, 1)
bgFrame.BackgroundColor3    = C.panel
bgFrame.BackgroundTransparency = 0.1
bgFrame.BorderSizePixel     = 0
bgFrame.Parent              = Main
corner(14, bgFrame)
gradient(C.bg, Color3.fromRGB(16, 24, 48), 145, bgFrame)

-- ── Header ────────────────────────────────────────────────
local Header = Instance.new("Frame")
Header.Size            = UDim2.new(1, 0, 0, 44)
Header.BackgroundColor3= C.header
Header.BorderSizePixel = 0
Header.Parent          = Main
corner(14, Header)

local hFix = Instance.new("Frame") -- tapa esquinas inf del header
hFix.Size = UDim2.new(1, 0, 0, 10)
hFix.Position = UDim2.new(0, 0, 1, -10)
hFix.BackgroundColor3 = C.header
hFix.BorderSizePixel = 0
hFix.Parent = Header

local hLine = Instance.new("Frame") -- línea degradada bajo el header
hLine.Size = UDim2.new(1, 0, 0, 2)
hLine.Position = UDim2.new(0, 0, 1, -1)
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
}, Header)

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
Content.Size     = UDim2.new(1, 0, 1, -44)
Content.BackgroundTransparency = 1
Content.Parent   = Main

local Layout = Instance.new("UIListLayout")
Layout.FillDirection = Enum.FillDirection.Vertical
Layout.Padding       = UDim.new(0, 6)
Layout.Parent        = Content
local Pad = Instance.new("UIPadding")
Pad.PaddingLeft  = UDim.new(0, 10)
Pad.PaddingRight = UDim.new(0, 10)
Pad.PaddingTop   = UDim.new(0, 8)
Pad.Parent       = Content

-- ── Toggle helper ─────────────────────────────────────────
local function makeToggle(icon, name, initState, onChange)
    local Row = Instance.new("Frame")
    Row.Size = UDim2.new(1, 0, 0, 36)
    Row.BackgroundColor3 = C.header
    Row.BorderSizePixel = 0
    Row.Parent = Content
    corner(8, Row)
    stroke(C.border, 1, 0.65, Row)

    label({
        Text = icon .. "  " .. name,
        Position = UDim2.new(0, 10, 0, 0),
        Size = UDim2.new(1, -58, 1, 0),
        TextXAlignment = Enum.TextXAlignment.Left,
        TextSize = 13,
    }, Row)

    local Pill = Instance.new("Frame")
    Pill.AnchorPoint = Vector2.new(1, 0.5)
    Pill.Position    = UDim2.new(1, -10, 0.5, 0)
    Pill.Size        = UDim2.fromOffset(40, 22)
    Pill.BorderSizePixel = 0
    Pill.Parent = Row
    corner(11, Pill)

    local Dot = Instance.new("Frame")
    Dot.Size        = UDim2.fromOffset(16, 16)
    Dot.AnchorPoint = Vector2.new(0.5, 0.5)
    Dot.Position    = UDim2.new(0, initState and 30 or 12, 0.5, 0)
    Dot.BackgroundColor3 = C.white
    Dot.BorderSizePixel  = 0
    Dot.Parent = Pill
    corner(8, Dot)

    local state = initState
    local function refresh(val)
        Pill.BackgroundColor3 = val and C.green or C.border
        tween(Dot, 0.15, { Position = UDim2.new(0, val and 30 or 12, 0.5, 0) })
    end
    refresh(state)

    local btn = Instance.new("TextButton")
    btn.Size = UDim2.fromScale(1, 1)
    btn.BackgroundTransparency = 1
    btn.Text = ""
    btn.Parent = Row
    btn.MouseButton1Click:Connect(function()
        state = not state
        refresh(state)
        onChange(state)
    end)
    return Row
end

makeToggle("🏏", "Auto Swing", State.autoSwing, function(v)
    State.autoSwing = v
end)
makeToggle("🎯", "Pitch Predictor", State.pitchPredict, function(v)
    State.pitchPredict = v
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

-- ── Info de pelota ─────────────────────────────────────────
local InfoBox = Instance.new("Frame")
InfoBox.Size = UDim2.new(1, 0, 0, 92)
InfoBox.BackgroundColor3 = C.header
InfoBox.BorderSizePixel = 0
InfoBox.Parent = Content
corner(8, InfoBox)
stroke(C.border, 1, 0.65, InfoBox)

label({ Text = "PELOTA", Position = UDim2.new(0,10,0,6),
    Size = UDim2.new(1,-20,0,14), TextSize=10,
    TextColor3=C.muted, TextXAlignment=Enum.TextXAlignment.Left }, InfoBox)

local lbTipo = label({ Text = "—",
    Position = UDim2.new(0,10,0,20), Size = UDim2.new(0.55,0,0,24),
    Font = Enum.Font.GothamBlack, TextSize = 22,
    TextColor3 = C.accent, TextXAlignment = Enum.TextXAlignment.Left }, InfoBox)

local lbMph = label({ Text = "— mph",
    Position = UDim2.new(0.55,0,0,20), Size = UDim2.new(0.45,-10,0,24),
    Font = Enum.Font.GothamBlack, TextSize = 18,
    TextColor3 = C.yellow, TextXAlignment = Enum.TextXAlignment.Right }, InfoBox)

local lbTiempo = label({ Text = "Esperando pitch...",
    Position = UDim2.new(0,10,0,48), Size = UDim2.new(1,-20,0,16),
    TextSize = 12, TextColor3 = C.muted,
    TextXAlignment = Enum.TextXAlignment.Left }, InfoBox)

local lbZona = label({ Text = "",
    Position = UDim2.new(0,10,0,66), Size = UDim2.new(1,-20,0,20),
    Font = Enum.Font.GothamBlack, TextSize = 13,
    TextXAlignment = Enum.TextXAlignment.Left }, InfoBox)

-- ── Info de rol ────────────────────────────────────────────
local PosBox = Instance.new("Frame")
PosBox.Size = UDim2.new(1, 0, 0, 48)
PosBox.BackgroundColor3 = C.header
PosBox.BorderSizePixel = 0
PosBox.Parent = Content
corner(8, PosBox)
stroke(C.border, 1, 0.65, PosBox)

label({ Text = "MI ROL", Position = UDim2.new(0,10,0,5),
    Size = UDim2.new(1,-20,0,14), TextSize=10,
    TextColor3=C.muted, TextXAlignment=Enum.TextXAlignment.Left }, PosBox)

local lbRol = label({ Text = "—",
    Position = UDim2.new(0,10,0,20), Size = UDim2.new(1,-20,0,22),
    Font = Enum.Font.GothamBlack, TextSize = 14,
    TextColor3 = C.green, TextXAlignment = Enum.TextXAlignment.Left }, PosBox)

-- ── Draggable ─────────────────────────────────────────────
do
    local drag, ds, sp = false
    Header.InputBegan:Connect(function(i)
        if i.UserInputType == Enum.UserInputType.MouseButton1
        or i.UserInputType == Enum.UserInputType.Touch then
            drag = true; ds = i.Position; sp = Main.Position
        end
    end)
    Header.InputEnded:Connect(function(i)
        if i.UserInputType == Enum.UserInputType.MouseButton1
        or i.UserInputType == Enum.UserInputType.Touch then
            drag = false
        end
    end)
    UIS.InputChanged:Connect(function(i)
        if drag and (i.UserInputType == Enum.UserInputType.MouseMovement
                  or i.UserInputType == Enum.UserInputType.Touch) then
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
    tween(Main, 0.2, {
        Size = minimized and UDim2.fromOffset(215, 44)
                          or  UDim2.fromOffset(215, 360)
    })
end)

-- ============================================================
--  MARCA DE CAÍDA (Pitch Predictor)
-- ============================================================
local marcaParte = nil

-- ZPlato = 1.2 (del módulo Pelota del juego)
local ZPLATO = Pelota.ZPlato or 1.2
local ZONA   = Pelota.Zona or { xMin=-1.4, xMax=1.4, yMin=1.5, yMax=4.3 }

-- Posición suavizada del aim (para seguir la pelota sin saltos bruscos)
local aimActual = Vector2.new(0, (ZONA.yMin + ZONA.yMax) / 2)

local function crearMarca()
    if marcaParte then pcall(function() marcaParte:Destroy() end) end

    local p = Instance.new("Part")
    p.Name         = "SMBMarca"
    p.Anchored     = true
    p.CanCollide   = false
    p.CanQuery     = false
    p.CanTouch     = false
    p.CastShadow   = false
    -- Disco vertical: Cylinder con Size(grosor, diámetro, diámetro)
    -- rotado 90° en X para que quede como plano vertical
    p.Shape        = Enum.PartType.Cylinder
    p.Size         = Vector3.new(0.06, 0.72, 0.72)
    p.Material     = Enum.Material.Neon
    p.Color        = C.green
    p.Transparency = 1
    p.Parent       = workspace

    -- SurfaceGui con círculo — igual que MarcaLlegada del juego
    for _, face in ipairs({Enum.NormalId.Front, Enum.NormalId.Back}) do
        local sg = Instance.new("SurfaceGui")
        sg.Face           = face
        sg.SizingMode     = Enum.SurfaceGuiSizingMode.FixedSize
        sg.CanvasSize     = Vector2.new(64, 64)
        sg.LightInfluence = 0
        sg.AlwaysOnTop    = true
        sg.Enabled        = false
        sg.Parent         = p

        local circulo = Instance.new("Frame")
        circulo.AnchorPoint          = Vector2.new(0.5, 0.5)
        circulo.Position             = UDim2.fromScale(0.5, 0.5)
        circulo.Size                 = UDim2.new(1, -8, 1, -8)
        circulo.BackgroundColor3     = C.green
        circulo.BackgroundTransparency = 0.4
        circulo.Parent               = sg
        Instance.new("UICorner", circulo).CornerRadius = UDim.new(0.5, 0)

        local borde = Instance.new("UIStroke")
        borde.Thickness = 3
        borde.Color     = C.green
        borde.Parent    = circulo
    end

    marcaParte = p
end
crearMarca()

local function mostrarMarca(pT, esStrike)
    if not State.pitchPredict or not marcaParte then return end

    -- Mismo posicionamiento que MarcaLlegada nativa del juego:
    -- CFrame.new(pT.X, pT.Y, ZPlato + 0.03)
    -- Rotamos 90° en X para que el Cylinder quede como disco vertical
    marcaParte.CFrame = CFrame.new(pT.X, pT.Y, ZPLATO + 0.03)
                      * CFrame.Angles(math.pi/2, 0, 0)

    local col = esStrike and C.green or C.red
    marcaParte.Color       = col
    marcaParte.Transparency = 0.4

    for _, sg in ipairs(marcaParte:GetChildren()) do
        if sg:IsA("SurfaceGui") then
            sg.Enabled = true
            local f = sg:FindFirstChildOfClass("Frame")
            if f then
                f.BackgroundColor3 = col
                local s = f:FindFirstChildOfClass("UIStroke")
                if s then s.Color = col end
            end
        end
    end
end

local function ocultarMarca()
    if not marcaParte then return end
    marcaParte.Transparency = 1
    for _, sg in ipairs(marcaParte:GetChildren()) do
        if sg:IsA("SurfaceGui") then sg.Enabled = false end
    end
end

-- ============================================================
--  AUTO SWING
-- ============================================================
local function hacerSwing(lanz, tipoSwing)
    if not Remote_Swing then return end
    if swingUsado[lanz.id] then return end

    -- Verificar que somos el bateador activo
    local bateadorId = SMB:GetAttribute("BateadorId")
    if bateadorId ~= LP.UserId then return end

    -- El juego exige que inicio + 0.1 ya haya pasado antes de swingear
    local ahora = workspace:GetServerTimeNow()
    if ahora < lanz.inicio + 0.1 then return end

    swingUsado[lanz.id] = true

    -- dt = diferencia entre ahora y el momento perfecto (inicio + T)
    -- dt = 0 → timing perfecto
    local dt = ahora - (lanz.inicio + lanz.T)

    -- Usar la posición suavizada del aim (aimActual)
    -- para que siga la pelota sin saltos bruscos
    local x = aimActual.X
    local y = aimActual.Y

    -- Swing:FireServer(id, dt, x, y, tipo)
    Remote_Swing:FireServer(lanz.id, dt, x, y, tipoSwing or "Normal")
end

-- ============================================================
--  LOOP PRINCIPAL
-- ============================================================
local nombresPosicion = {
    Pitcher   = "⚾ Lanzador",
    Primera   = "1️⃣ Primera Base",
    Segunda   = "2️⃣ Segunda Base",
    Tercera   = "3️⃣ Tercera Base",
    CortoParo = "⚡ Parador Corto",
    Izquierdo = "⬅ Left Field",
    Central   = "⬆ Center Field",
    Derecho   = "➡ Right Field",
    Receptor  = "🧤 Receptor",
    Designado = "🏏 Bateador DH",
}

RunService.RenderStepped:Connect(function(dt)
    -- ── Rol del jugador ───────────────────────────────────
    local posAttr    = LP:GetAttribute("Posicion")
    local bateadorId = SMB:GetAttribute("BateadorId")
    local esBater    = bateadorId == LP.UserId
    local rolTexto   = "Lobby"
    local rolColor   = C.muted

    if LP:GetAttribute("Espectar") then
        rolTexto = "👁 Espectador"
    elseif posAttr then
        rolTexto = nombresPosicion[posAttr] or posAttr
        rolColor = esBater and C.accent or C.green
    end
    lbRol.Text       = rolTexto
    lbRol.TextColor3 = rolColor

    -- ── Lanzamiento activo ────────────────────────────────
    local lanz = lanzActual

    if lanz and lanz.pT and lanz.inicio and lanz.T then
        local ahora     = workspace:GetServerTimeNow()
        local tRestante = (lanz.inicio + lanz.T) - ahora

        -- Suavizar el aim hacia pT para evitar saltos bruscos
        -- Velocidad de seguimiento: más rápido cuando queda poco tiempo
        local velLerp = math.clamp(dt * (tRestante < 0.3 and 18 or 8), 0, 1)
        aimActual = aimActual:Lerp(Vector2.new(lanz.pT.X, lanz.pT.Y), velLerp)

        -- UI de pelota
        lbTipo.Text = lanz.tipo or lanz.nombre or "?"
        lbMph.Text  = (lanz.mph or "?") .. " mph"

        if tRestante > 0.01 then
            lbTiempo.Text       = string.format("⏱ Llega en %.2fs", tRestante)
            lbTiempo.TextColor3 = tRestante < 0.2 and C.red
                               or tRestante < 0.4 and C.yellow
                               or C.green
        else
            lbTiempo.Text       = "✅ Cruzó el plato"
            lbTiempo.TextColor3 = C.muted
        end

        local esStrike = Pelota.EnZona(lanz.pT.X, lanz.pT.Y)
        lbZona.Text       = esStrike and "🟢 STRIKE — dale!" or "🔴 BOLA — espera"
        lbZona.TextColor3 = esStrike and C.green or C.red

        -- Pitch predictor: círculo en la posición suavizada
        mostrarMarca(Vector3.new(aimActual.X, aimActual.Y, ZPLATO), esStrike)

        -- Auto Swing
        if State.autoSwing and esBater then
            local fase = SMB:GetAttribute("FaseDuelo") or LP:GetAttribute("FaseDuelo")
            local enJuego = (fase == "Lanzando" or fase == "EnVuelo")
            if enJuego and not swingUsado[lanz.id] then
                -- Swingear cuando estamos a 1 frame del momento perfecto
                local margen = CFG_BAT.VentanaPerfecta or 0.08
                if tRestante <= margen and tRestante > -0.15 then
                    local tipoSwing = esStrike and "Poder" or "Normal"
                    hacerSwing(lanz, tipoSwing)
                end
            end
        end

    else
        -- Sin lanzamiento activo
        lbTipo.Text         = "—"
        lbMph.Text          = "— mph"
        lbTiempo.Text       = "Esperando pitch..."
        lbTiempo.TextColor3 = C.muted
        lbZona.Text         = ""
        ocultarMarca()
        -- Resetear aim al centro de la zona
        aimActual = Vector2.new(0, (ZONA.yMin + ZONA.yMax) / 2)
    end

    -- ── Field Tracker ─────────────────────────────────────
    if State.fieldTrack and posAttr and posAttr ~= "Designado" and not esBater then
        local pelotaObj = workspace:FindFirstChild("Pelota")
                       or workspace:FindFirstChild("Ball")
        if pelotaObj and pelotaObj:IsA("BasePart") then
            local char = LP.Character
            local hrp  = char and char:FindFirstChild("HumanoidRootPart")
            if hrp then
                local dist = (pelotaObj.Position - hrp.Position).Magnitude
                lbTiempo.Text       = string.format("🏃 Pelota: %.1f studs", dist)
                lbTiempo.TextColor3 = dist < 15 and C.yellow or C.muted
            end
        end
    end
end)

print("[SMB Hack] ✅ Cargado — Auto Swing, Pitch Predictor y Field Tracker activos")

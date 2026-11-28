-- ============================================================
--   SUPERSTAR BASEBALL - HACK SCRIPT  v2
--   Ventana flotante · Neon Azul · Delta compatible
--   Auto Swing · Pitch Predictor · Field Track
-- ============================================================

local Players      = game:GetService("Players")
local RunService   = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local UIS          = game:GetService("UserInputService")
local LP           = Players.LocalPlayer
local RS           = game:GetService("ReplicatedStorage")

-- ── Esperar recursos del juego ────────────────────────────
local Remotes  = RS:WaitForChild("RemoteEvents", 10)
local GameVals = RS:WaitForChild("GameValues",   10)

if not Remotes then warn("[SB] No RemoteEvents"); return end

local Remote_SwingBat  = Remotes:WaitForChild("SwingBat",  10)
local Remote_BallLanded= Remotes:WaitForChild("BallLanded",10)

local BallHolder = workspace:WaitForChild("BallHolder", 10)
if not BallHolder then warn("[SB] No BallHolder"); return end

-- ── Estado ────────────────────────────────────────────────
local ballPart  = nil
local swingDone = false
local strikeZone= nil
local State = { autoSwing = false, pitchPredict = true, fieldTrack = true }

task.spawn(function()
    local pitching = workspace:WaitForChild("Pitching", 15)
    if pitching then
        strikeZone = pitching:WaitForChild("StrikeZone", 10)
    end
end)

-- ── Helpers ───────────────────────────────────────────────
local function tw(obj, t, props)
    TweenService:Create(obj, TweenInfo.new(t, Enum.EasingStyle.Quad), props):Play()
end
local function corner(r, p)
    local c = Instance.new("UICorner", p)
    c.CornerRadius = UDim.new(0, r)
end
local function mkLabel(parent, props)
    local lb = Instance.new("TextLabel")
    lb.BackgroundTransparency = 1
    lb.Font       = Enum.Font.GothamBold
    lb.TextSize   = 13
    lb.TextColor3 = Color3.fromRGB(230, 236, 250)
    lb.TextXAlignment = Enum.TextXAlignment.Center
    for k, v in pairs(props) do lb[k] = v end
    lb.Parent = parent
    return lb
end

-- ── Colores ───────────────────────────────────────────────
local BG     = Color3.fromRGB(10,  13,  22)
local BG2    = Color3.fromRGB(14,  18,  40)
local BLUE   = Color3.fromRGB(80, 160, 255)
local PINK   = Color3.fromRGB(236, 62, 196)
local GREEN  = Color3.fromRGB(50,  220, 130)
local YELLOW = Color3.fromRGB(244, 196,  72)
local RED    = Color3.fromRGB(235,  55,  55)
local WHITE  = Color3.fromRGB(230, 236, 250)
local MUTED  = Color3.fromRGB(100, 120, 165)

-- ============================================================
--  GUI — VENTANA FLOTANTE
-- ============================================================
local Gui = Instance.new("ScreenGui")
Gui.Name           = "SBHack"
Gui.ResetOnSpawn   = false
Gui.IgnoreGuiInset = true
Gui.DisplayOrder   = 99
Gui.Parent         = LP:WaitForChild("PlayerGui")

-- Ventana principal
local Win = Instance.new("Frame")
Win.Name                  = "Win"
Win.Size                  = UDim2.fromOffset(230, 290)
Win.Position              = UDim2.new(0.05, 0, 0.3, 0)
Win.BackgroundColor3      = BG
Win.BackgroundTransparency= 0.08
Win.BorderSizePixel        = 0
Win.Parent                 = Gui
corner(14, Win)

-- Gradiente de fondo
local grad = Instance.new("UIGradient", Win)
grad.Color    = ColorSequence.new({
    ColorSequenceKeypoint.new(0,   Color3.fromRGB(10, 13, 30)),
    ColorSequenceKeypoint.new(1,   Color3.fromRGB(8,  12, 22)),
})
grad.Rotation = 135

-- Borde neon azul/rosa
local border = Instance.new("UIStroke", Win)
border.Color       = BLUE
border.Thickness   = 1.5
border.Transparency= 0.3

-- ── HEADER ────────────────────────────────────────────────
local Header = Instance.new("Frame")
Header.Size             = UDim2.new(1, 0, 0, 36)
Header.BackgroundColor3 = BG2
Header.BackgroundTransparency = 0.3
Header.BorderSizePixel  = 0
Header.Parent           = Win
corner(14, Header)
-- Recortar esquinas inferiores del header
local headerFix = Instance.new("Frame")
headerFix.Size             = UDim2.new(1, 0, 0, 14)
headerFix.Position         = UDim2.new(0, 0, 1, -14)
headerFix.BackgroundColor3 = BG2
headerFix.BackgroundTransparency = 0.3
headerFix.BorderSizePixel  = 0
headerFix.Parent           = Header

local titleLb = Instance.new("TextLabel")
titleLb.Size             = UDim2.new(1, -44, 1, 0)
titleLb.Position         = UDim2.new(0, 10, 0, 0)
titleLb.BackgroundTransparency = 1
titleLb.Font             = Enum.Font.GothamBlack
titleLb.TextSize         = 15
titleLb.TextColor3       = WHITE
titleLb.TextXAlignment   = Enum.TextXAlignment.Left
titleLb.Text             = "⚾  SB HACK"
titleLb.Parent           = Header

-- Separador neon
local sep = Instance.new("Frame")
sep.Size             = UDim2.new(1, -20, 0, 1)
sep.Position         = UDim2.new(0, 10, 0, 35)
sep.BackgroundColor3 = BLUE
sep.BackgroundTransparency = 0.4
sep.BorderSizePixel  = 0
sep.Parent           = Win

-- Botón lock (top right del header)
local locked = false
local LockBtn = Instance.new("TextButton")
LockBtn.Size             = UDim2.fromOffset(26, 26)
LockBtn.Position         = UDim2.new(1, -30, 0, 5)
LockBtn.BackgroundColor3 = BG
LockBtn.BackgroundTransparency = 0.5
LockBtn.Text             = "🔓"
LockBtn.TextSize         = 13
LockBtn.Font             = Enum.Font.GothamBold
LockBtn.TextColor3       = WHITE
LockBtn.BorderSizePixel  = 0
LockBtn.Parent           = Header
corner(13, LockBtn)

LockBtn.MouseButton1Click:Connect(function()
    locked = not locked
    LockBtn.Text = locked and "🔒" or "🔓"
    tw(border, 0.2, { Color = locked and YELLOW or BLUE })
end)

-- ── DRAG ──────────────────────────────────────────────────
do
    local drag, ds, sp = false, nil, nil
    Header.InputBegan:Connect(function(i)
        if locked then return end
        if i.UserInputType == Enum.UserInputType.MouseButton1
        or i.UserInputType == Enum.UserInputType.Touch then
            drag = true; ds = i.Position; sp = Win.Position
        end
    end)
    Header.InputEnded:Connect(function(i)
        if i.UserInputType == Enum.UserInputType.MouseButton1
        or i.UserInputType == Enum.UserInputType.Touch then
            drag = false
        end
    end)
    UIS.InputChanged:Connect(function(i)
        if not drag or locked then return end
        if i.UserInputType ~= Enum.UserInputType.MouseMovement
        and i.UserInputType ~= Enum.UserInputType.Touch then return end
        local d = i.Position - ds
        Win.Position = UDim2.new(
            sp.X.Scale, sp.X.Offset + d.X,
            sp.Y.Scale, sp.Y.Offset + d.Y)
    end)
end

-- ── INFO SECTION ──────────────────────────────────────────
-- Tipo de pitch (grande, centrado)
local lbTipo = mkLabel(Win, {
    Size     = UDim2.new(1, 0, 0, 30),
    Position = UDim2.new(0, 0, 0, 44),
    Text     = "⚾  —",
    TextSize = 16,
    TextColor3 = BLUE,
    Font     = Enum.Font.GothamBlack,
})

-- Velocidad
local lbSpeed = mkLabel(Win, {
    Size     = UDim2.new(1, 0, 0, 20),
    Position = UDim2.new(0, 0, 0, 72),
    Text     = "— mph",
    TextSize = 22,
    TextColor3 = YELLOW,
    Font     = Enum.Font.GothamBlack,
})

-- Strike / Bola
local lbZona = mkLabel(Win, {
    Size     = UDim2.new(1, 0, 0, 22),
    Position = UDim2.new(0, 0, 0, 100),
    Text     = "· · ·",
    TextSize = 14,
    TextColor3 = MUTED,
    Font     = Enum.Font.GothamBlack,
})

-- Separador 2
local sep2 = Instance.new("Frame")
sep2.Size             = UDim2.new(1, -30, 0, 1)
sep2.Position         = UDim2.new(0, 15, 0, 128)
sep2.BackgroundColor3 = BLUE
sep2.BackgroundTransparency = 0.65
sep2.BorderSizePixel  = 0
sep2.Parent           = Win

-- Distancia
local lbDist = mkLabel(Win, {
    Size     = UDim2.new(1, -20, 0, 18),
    Position = UDim2.new(0, 10, 0, 134),
    Text     = "esperando pitch...",
    TextSize = 10,
    TextColor3 = MUTED,
    Font     = Enum.Font.GothamMono,
    TextXAlignment = Enum.TextXAlignment.Center,
})

-- Debug
local lbDebug = mkLabel(Win, {
    Size     = UDim2.new(1, -20, 0, 14),
    Position = UDim2.new(0, 10, 0, 152),
    Text     = "...",
    TextSize = 8,
    TextColor3 = Color3.fromRGB(60, 90, 140),
    Font     = Enum.Font.GothamMono,
    TextXAlignment = Enum.TextXAlignment.Center,
})

-- ── SEPARADOR BOTONES ─────────────────────────────────────
local sep3 = Instance.new("Frame")
sep3.Size             = UDim2.new(1, -20, 0, 1)
sep3.Position         = UDim2.new(0, 10, 0, 170)
sep3.BackgroundColor3 = BLUE
sep3.BackgroundTransparency = 0.5
sep3.BorderSizePixel  = 0
sep3.Parent           = Win

-- ── BOTONES — Colocados manualmente, hijos directos de Win ──
-- Cada botón tiene posición absoluta, sin UIListLayout, sin Wrapper.
-- Ancho de cada botón: 62px. Gap: 8px. Total: 62*3+8*2 = 202px
-- Centrado en 230px: margen = (230-202)/2 = 14px

local BTN_Y   = 180   -- Y desde top de Win
local BTN_H   = 40
local BTN_W   = 62
local BTN_GAP = 8
local BTN_X1  = 14
local BTN_X2  = BTN_X1 + BTN_W + BTN_GAP
local BTN_X3  = BTN_X2 + BTN_W + BTN_GAP

local function makeToggleBtn(x, icon, label, initActive, onToggle)
    -- Fondo del botón
    local f = Instance.new("Frame")
    f.Size             = UDim2.fromOffset(BTN_W, BTN_H)
    f.Position         = UDim2.fromOffset(x, BTN_Y)
    f.BackgroundColor3 = initActive and BLUE or BG2
    f.BackgroundTransparency = initActive and 0.3 or 0.6
    f.BorderSizePixel  = 0
    f.Parent           = Win
    corner(10, f)

    -- Borde neon
    local st = Instance.new("UIStroke", f)
    st.Color       = BLUE
    st.Thickness   = 1.2
    st.Transparency= initActive and 0.1 or 0.6

    -- Icono
    local ico = Instance.new("TextLabel")
    ico.Size             = UDim2.new(1, 0, 0, 20)
    ico.Position         = UDim2.new(0, 0, 0, 5)
    ico.BackgroundTransparency = 1
    ico.Font             = Enum.Font.GothamBold
    ico.TextSize         = 18
    ico.TextColor3       = WHITE
    ico.Text             = icon
    ico.Parent           = f

    -- Texto label
    local tx = Instance.new("TextLabel")
    tx.Size             = UDim2.new(1, 0, 0, 14)
    tx.Position         = UDim2.new(0, 0, 0, 24)
    tx.BackgroundTransparency = 1
    tx.Font             = Enum.Font.GothamBold
    tx.TextSize         = 9
    tx.TextColor3       = initActive and WHITE or MUTED
    tx.Text             = label
    tx.Parent           = f

    -- Botón invisible encima para capturar clicks
    local btn = Instance.new("TextButton")
    btn.Size             = UDim2.fromScale(1, 1)
    btn.BackgroundTransparency = 1
    btn.Text             = ""
    btn.Parent           = f

    local active = initActive
    btn.MouseButton1Click:Connect(function()
        active = not active
        tw(f,  0.15, {
            BackgroundColor3    = active and BLUE or BG2,
            BackgroundTransparency = active and 0.3 or 0.6,
        })
        tw(st, 0.15, { Transparency = active and 0.1 or 0.6 })
        tw(tx, 0.15, { TextColor3   = active and WHITE or MUTED })
        onToggle(active)
    end)

    return f
end

makeToggleBtn(BTN_X1, "🏏", "AUTO SWING",  State.autoSwing,    function(v) State.autoSwing    = v end)
makeToggleBtn(BTN_X2, "🎯", "PREDICTOR",  State.pitchPredict,  function(v) State.pitchPredict = v end)
makeToggleBtn(BTN_X3, "🧤", "FIELD TRK",  State.fieldTrack,    function(v) State.fieldTrack   = v end)

-- ── BARRA DE ESTADO (bottom) ──────────────────────────────
local StatusBar = Instance.new("Frame")
StatusBar.Size             = UDim2.new(1, 0, 0, 24)
StatusBar.Position         = UDim2.new(0, 0, 1, -24)
StatusBar.BackgroundColor3 = BG2
StatusBar.BackgroundTransparency = 0.3
StatusBar.BorderSizePixel  = 0
StatusBar.Parent           = Win
corner(14, StatusBar)
-- Tapar esquinas superiores
local sbFix = Instance.new("Frame")
sbFix.Size             = UDim2.new(1, 0, 0, 14)
sbFix.BackgroundColor3 = BG2
sbFix.BackgroundTransparency = 0.3
sbFix.BorderSizePixel  = 0
sbFix.Parent           = StatusBar

local lbStatus = mkLabel(StatusBar, {
    Size     = UDim2.fromScale(1, 1),
    Text     = "⬤  Esperando...",
    TextSize = 9,
    TextColor3 = MUTED,
    Font     = Enum.Font.GothamMono,
})

-- ============================================================
--  PITCH PREDICTOR — Marca en el mundo 3D
-- ============================================================
local marcaParte = nil

local function crearMarca()
    if marcaParte then pcall(function() marcaParte:Destroy() end) end
    local p = Instance.new("Part")
    p.Name         = "SBMarca"
    p.Anchored     = true
    p.CanCollide   = false
    p.CanQuery     = false
    p.CanTouch     = false
    p.CastShadow   = false
    p.Size         = Vector3.new(0.72, 0.72, 0.04)
    p.Material     = Enum.Material.Neon
    p.Color        = GREEN
    p.Transparency = 1
    p.Parent       = workspace

    for _, face in ipairs({Enum.NormalId.Front, Enum.NormalId.Back}) do
        local sg = Instance.new("SurfaceGui", p)
        sg.Face         = face
        sg.SizingMode   = Enum.SurfaceGuiSizingMode.FixedSize
        sg.CanvasSize   = Vector2.new(64, 64)
        sg.LightInfluence = 0
        sg.AlwaysOnTop  = true
        sg.Enabled      = false

        local f = Instance.new("Frame", sg)
        f.AnchorPoint    = Vector2.new(0.5, 0.5)
        f.Position       = UDim2.fromScale(0.5, 0.5)
        f.Size           = UDim2.new(1, -4, 1, -4)
        f.BackgroundColor3 = GREEN
        f.BackgroundTransparency = 0.5
        corner(32, f)
        local b = Instance.new("UIStroke", f)
        b.Thickness = 4; b.Color = GREEN
    end
    marcaParte = p
end
crearMarca()

local function mostrarMarca(pos, isStrike)
    if not State.pitchPredict or not marcaParte or not strikeZone then return end
    marcaParte.CFrame       = CFrame.new(pos.X, pos.Y, strikeZone.Position.Z)
    local col               = isStrike and GREEN or RED
    marcaParte.Color        = col
    marcaParte.Transparency = 0.5
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
--  LÓGICA DEL JUEGO
-- ============================================================
local function esStrike(ballPos)
    if not strikeZone then return false end
    local local_ = strikeZone.CFrame:PointToObjectSpace(ballPos)
    local half   = strikeZone.Size / 2
    return math.abs(local_.X) <= half.X
       and math.abs(local_.Y) <= half.Y
       and math.abs(local_.Z) <= half.Z
end

local function hacerSwing(ball)
    if not Remote_SwingBat or swingDone then return end
    local currentBatter = GameVals and GameVals:FindFirstChild("CurrentBatter")
    if currentBatter and currentBatter.Value ~= LP then return end
    swingDone = true
    lbDebug.Text = "SWING!"
    lbDebug.TextColor3 = GREEN
    local ballPos = ball.Position
    local dir = ball:GetAttribute("Direction") or Vector3.new(0, 0, -1)
    Remote_SwingBat:FireServer(ballPos, ballPos, dir, "Power")
    task.delay(0.4, function() lbDebug.TextColor3 = Color3.fromRGB(60, 90, 140) end)
end

local function buscarPelota()
    return BallHolder:FindFirstChild("Baseball") or BallHolder:FindFirstChildOfClass("Part")
end

BallHolder.ChildAdded:Connect(function(child)
    if child:IsA("BasePart") then
        ballPart  = child
        swingDone = false
    end
end)
BallHolder.ChildRemoved:Connect(function(child)
    if child == ballPart then
        ballPart  = nil
        swingDone = false
    end
end)

-- Escuchar PitchBall para saber el tipo/velocidad desde el evento del juego
local pitchInfo = { tipo = "—", speed = "—" }
Remotes.PitchBall.OnClientEvent:Connect(function(ball, startPos, ctrl, endPos, duration, ability, isStraight, speed, throwStyle)
    pitchInfo.tipo  = throwStyle or ability or "Normal"
    pitchInfo.speed = speed and (math.floor(speed * 100) .. " mph") or "—"
    ballPart  = ball
    swingDone = false
end)

-- ============================================================
--  LOOP PRINCIPAL
-- ============================================================
local aimActual = Vector3.new(0, 3, 0)

local function fmt(s)
    if not s or s <= 0 then return "--:--" end
    return string.format("%d:%02d", math.floor(s/60), s%60)
end

RunService.RenderStepped:Connect(function(dt)
    if not (ballPart and ballPart.Parent) then
        ballPart = buscarPelota()
    end

    local ball = ballPart

    if ball and ball.Parent then
        local ballPos   = ball.Position
        local isStrike_ = esStrike(ballPos)

        aimActual = aimActual:Lerp(ballPos, math.clamp(dt * 10, 0, 1))

        -- Actualizar labels
        lbTipo.Text       = "⚾  " .. pitchInfo.tipo
        lbSpeed.Text      = pitchInfo.speed
        lbZona.Text       = isStrike_ and "✓  STRIKE" or "✗  BOLA"
        lbZona.TextColor3 = isStrike_ and GREEN or RED

        if strikeZone then
            local dist = math.abs(ballPos.Z - strikeZone.Position.Z)
            lbDist.Text       = string.format("📍 %.1f studs al plato", dist)
            lbDist.TextColor3 = dist < 5 and RED or dist < 15 and YELLOW or MUTED
        end

        border.Color = isStrike_ and GREEN or BLUE
        lbStatus.Text = "⬤  Ball detected • " .. ball.Name
        lbStatus.TextColor3 = GREEN

        mostrarMarca(aimActual, isStrike_)

        if State.autoSwing and isStrike_ and not swingDone and strikeZone then
            local dist = math.abs(ballPos.Z - strikeZone.Position.Z)
            lbDebug.Text = string.format("d:%.1f", dist)
            if dist < 8 then hacerSwing(ball) end
        end

    else
        lbTipo.Text        = "⚾  —"
        lbSpeed.Text       = "— mph"
        lbZona.Text        = "· · ·"
        lbZona.TextColor3  = MUTED
        lbDist.Text        = "esperando pitch..."
        lbDist.TextColor3  = MUTED
        border.Color       = locked and YELLOW or BLUE
        lbStatus.Text      = "⬤  Esperando..."
        lbStatus.TextColor3= MUTED
        ocultarMarca()

        if State.fieldTrack then
            local char = LP.Character
            local hrp  = char and char:FindFirstChild("HumanoidRootPart")
            local liveBall = BallHolder:FindFirstChildOfClass("Part")
            if hrp and liveBall then
                local dist = (liveBall.Position - hrp.Position).Magnitude
                lbDist.Text       = string.format("🏃 %.1f studs", dist)
                lbDist.TextColor3 = dist < 15 and YELLOW or MUTED
            end
        end
    end
end)

lbDebug.Text = "cargado ✓"
print("[SB Hack v2] ✅ Cargado")

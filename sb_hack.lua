-- ============================================================
--   SUPERSTAR BASEBALL - HACK SCRIPT
--   Auto Swing · Pitch Predictor · Panel Circular
--   Basado en análisis del código fuente del juego
-- ============================================================

local Players      = game:GetService("Players")
local RunService   = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local UIS          = game:GetService("UserInputService")
local LP           = Players.LocalPlayer
local CAM          = workspace.CurrentCamera

-- ── Recursos del juego ────────────────────────────────────
local RS       = game:GetService("ReplicatedStorage")
local Remotes  = RS:WaitForChild("RemoteEvents", 10)
local GameVals = RS:WaitForChild("GameValues", 10)

if not Remotes then warn("[SB] No se encontró RemoteEvents"); return end

local Remote_PitchBall = Remotes:WaitForChild("PitchBall", 10)
local Remote_SwingBat  = Remotes:WaitForChild("SwingBat", 10)

-- ── Estado ───────────────────────────────────────────────
local ballPart   = nil   -- BasePart de la pelota actual
local swingDone  = false -- ya swingueamos este pitch?
local State = {
    autoSwing    = false,
    pitchPredict = true,
    fieldTrack   = true,
}

-- ── Colores ───────────────────────────────────────────────
local C = {
    bg      = Color3.fromRGB(10,  13,  22),
    dark    = Color3.fromRGB(14,  18,  32),
    border  = Color3.fromRGB(50,  65, 100),
    accent  = Color3.fromRGB(80, 160, 255),
    accent2 = Color3.fromRGB(236, 62, 196),
    green   = Color3.fromRGB(50,  220, 130),
    yellow  = Color3.fromRGB(244, 196,  72),
    red     = Color3.fromRGB(235,  55,  55),
    white   = Color3.fromRGB(230, 236, 250),
    muted   = Color3.fromRGB(120, 135, 165),
}

local function tween(obj, t, props)
    TweenService:Create(obj, TweenInfo.new(t, Enum.EasingStyle.Quad), props):Play()
end
local function corner(r, p)
    Instance.new("UICorner", p).CornerRadius = UDim.new(0, r)
end
local function stroke(col, th, p)
    local s = Instance.new("UIStroke", p)
    s.Color = col; s.Thickness = th
end

-- ── Encontrar BallHolder y pelota ─────────────────────────
local BallHolder = workspace:WaitForChild("BallHolder", 10)
if not BallHolder then 
    warn("[SB] No se encontró BallHolder")
    return
end

-- Monitorear pelota en BallHolder
local function buscarPelota()
    return BallHolder:FindFirstChild("Baseball") or BallHolder:FindFirstChildOfClass("Part")
end

-- Listener cuando aparece/desaparece pelota
BallHolder.ChildAdded:Connect(function(child)
    if child.Name == "Baseball" or child:IsA("BasePart") then
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

-- ── Strike Zone ───────────────────────────────────────────
local strikeZone = nil
task.spawn(function()
    local pitching = workspace:WaitForChild("Pitching", 10)
    if pitching then
        strikeZone = pitching:WaitForChild("StrikeZone", 10)
    end
end)

-- Verificar si la pelota está en la zona de strike
local function esStrike(ballPos)
    if not strikeZone then return false end
    local sz     = strikeZone
    local local_ = sz.CFrame:PointToObjectSpace(ballPos)
    local half   = sz.Size / 2
    return math.abs(local_.X) <= half.X
       and math.abs(local_.Y) <= half.Y
end

-- ============================================================
--  GUI — CÍRCULO PRINCIPAL
-- ============================================================
local Gui = Instance.new("ScreenGui")
Gui.Name           = "SB_Hack"
Gui.ResetOnSpawn   = false
Gui.IgnoreGuiInset = true
Gui.DisplayOrder   = 50
Gui.Parent         = LP:WaitForChild("PlayerGui")

local Circle = Instance.new("Frame")
Circle.Name             = "Circle"
Circle.AnchorPoint      = Vector2.new(0.5, 0.5)
Circle.Position         = UDim2.new(0.08, 0, 0.5, 0)
Circle.Size             = UDim2.fromOffset(120, 120)
Circle.BackgroundColor3 = C.dark
Circle.BackgroundTransparency = 0.1
Circle.BorderSizePixel  = 0
Circle.Parent           = Gui
corner(60, Circle)

local bgGrad = Instance.new("UIGradient", Circle)
bgGrad.Color    = ColorSequence.new(C.bg, Color3.fromRGB(18, 28, 52))
bgGrad.Rotation = 135

local accentRing = Instance.new("UIStroke", Circle)
accentRing.Color       = C.accent
accentRing.Thickness   = 2.5
accentRing.Transparency = 0.4

-- Labels
local lbTipo = Instance.new("TextLabel")
lbTipo.Size = UDim2.new(1, 0, 0, 28)
lbTipo.Position = UDim2.new(0, 0, 0, 14)
lbTipo.BackgroundTransparency = 1
lbTipo.Font = Enum.Font.GothamBlack
lbTipo.TextSize = 14
lbTipo.TextColor3 = C.accent
lbTipo.Text = "⚾"
lbTipo.Parent = Circle

local lbSpeed = Instance.new("TextLabel")
lbSpeed.Size = UDim2.new(1, 0, 0, 18)
lbSpeed.Position = UDim2.new(0, 0, 0, 40)
lbSpeed.BackgroundTransparency = 1
lbSpeed.Font = Enum.Font.GothamBold
lbSpeed.TextSize = 12
lbSpeed.TextColor3 = C.yellow
lbSpeed.Text = ""
lbSpeed.Parent = Circle

local lbZona = Instance.new("TextLabel")
lbZona.Size = UDim2.new(1, 0, 0, 20)
lbZona.Position = UDim2.new(0, 0, 0, 58)
lbZona.BackgroundTransparency = 1
lbZona.Font = Enum.Font.GothamBlack
lbZona.TextSize = 14
lbZona.TextColor3 = C.muted
lbZona.Text = "·"
lbZona.Parent = Circle

local lbDist = Instance.new("TextLabel")
lbDist.Size = UDim2.new(1, -8, 0, 14)
lbDist.Position = UDim2.new(0, 4, 0, 80)
lbDist.BackgroundTransparency = 1
lbDist.Font = Enum.Font.Gotham
lbDist.TextSize = 10
lbDist.TextColor3 = C.muted
lbDist.Text = "esperando..."
lbDist.Parent = Circle

-- ── Botones debajo del círculo ─────────────────────────────
local BtnRow = Instance.new("Frame")
BtnRow.AnchorPoint = Vector2.new(0.5, 0)
BtnRow.Position    = UDim2.new(0.5, 0, 1, 8)
BtnRow.Size        = UDim2.fromOffset(120, 30)
BtnRow.BackgroundTransparency = 1
BtnRow.Parent      = Circle

local BtnLayout = Instance.new("UIListLayout", BtnRow)
BtnLayout.FillDirection       = Enum.FillDirection.Horizontal
BtnLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
BtnLayout.Padding             = UDim.new(0, 4)

local function makeBtn(icon, active, onClick)
    local btn = Instance.new("TextButton")
    btn.Size             = UDim2.fromOffset(28, 28)
    btn.BackgroundColor3 = active and C.accent or C.dark
    btn.BackgroundTransparency = active and 0.1 or 0.5
    btn.Text             = icon
    btn.TextSize         = 14
    btn.Font             = Enum.Font.GothamBold
    btn.TextColor3       = C.white
    btn.BorderSizePixel  = 0
    btn.Parent           = BtnRow
    corner(14, btn)
    stroke(C.border, 1, btn)

    local isActive = active
    btn.MouseButton1Click:Connect(function()
        isActive = not isActive
        btn.BackgroundColor3 = isActive and C.accent or C.dark
        tween(btn, 0.1, { BackgroundTransparency = isActive and 0.1 or 0.5 })
        onClick(isActive)
    end)
    return btn
end

makeBtn("🏏", State.autoSwing,    function(v) State.autoSwing    = v end)
makeBtn("🎯", State.pitchPredict, function(v) State.pitchPredict = v end)
makeBtn("🧤", State.fieldTrack,   function(v) State.fieldTrack   = v end)

-- ── Botón candado ──────────────────────────────────────────
local locked = false
local LockBtn = Instance.new("TextButton")
LockBtn.AnchorPoint      = Vector2.new(1, 0)
LockBtn.Position         = UDim2.new(1, -2, 0, 2)
LockBtn.Size             = UDim2.fromOffset(22, 22)
LockBtn.BackgroundColor3 = C.dark
LockBtn.BackgroundTransparency = 0.3
LockBtn.Text             = "🔓"
LockBtn.TextSize         = 11
LockBtn.Font             = Enum.Font.GothamBold
LockBtn.TextColor3       = C.white
LockBtn.BorderSizePixel  = 0
LockBtn.ZIndex           = 10
LockBtn.Parent           = Circle
corner(11, LockBtn)
stroke(C.border, 1, LockBtn)

LockBtn.MouseButton1Click:Connect(function()
    locked = not locked
    LockBtn.Text             = locked and "🔒" or "🔓"
    LockBtn.BackgroundColor3 = locked and C.yellow or C.dark
    tween(LockBtn, 0.15, { BackgroundTransparency = locked and 0.1 or 0.3 })
    accentRing.Color = locked and C.yellow or C.accent
end)

-- ── Drag ──────────────────────────────────────────────────
do
    local drag, ds, sp = false
    Circle.InputBegan:Connect(function(i)
        if locked then return end
        if i.UserInputType == Enum.UserInputType.MouseButton1
        or i.UserInputType == Enum.UserInputType.Touch then
            drag = true; ds = i.Position; sp = Circle.Position
        end
    end)
    Circle.InputEnded:Connect(function(i)
        if i.UserInputType == Enum.UserInputType.MouseButton1
        or i.UserInputType == Enum.UserInputType.Touch then
            drag = false
        end
    end)
    UIS.InputChanged:Connect(function(i)
        if drag and not locked and
          (i.UserInputType == Enum.UserInputType.MouseMovement
        or i.UserInputType == Enum.UserInputType.Touch) then
            local d = i.Position - ds
            Circle.Position = UDim2.new(
                sp.X.Scale, sp.X.Offset + d.X,
                sp.Y.Scale, sp.Y.Offset + d.Y)
        end
    end)
end

-- ============================================================
--  MARCA DE CAÍDA (Pitch Predictor)
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
    p.Shape        = Enum.PartType.Block
    p.Size         = Vector3.new(0.72, 0.72, 0.04)
    p.Material     = Enum.Material.Neon
    p.Color        = C.green
    p.Transparency = 1
    p.Parent       = workspace

    for _, face in ipairs({Enum.NormalId.Front, Enum.NormalId.Back}) do
        local sg = Instance.new("SurfaceGui", p)
        sg.Face           = face
        sg.SizingMode     = Enum.SurfaceGuiSizingMode.FixedSize
        sg.CanvasSize     = Vector2.new(64, 64)
        sg.LightInfluence = 0
        sg.AlwaysOnTop    = true
        sg.Enabled        = false

        local circ = Instance.new("Frame", sg)
        circ.AnchorPoint          = Vector2.new(0.5, 0.5)
        circ.Position             = UDim2.fromScale(0.5, 0.5)
        circ.Size                 = UDim2.new(1, -4, 1, -4)
        circ.BackgroundColor3     = C.green
        circ.BackgroundTransparency = 0.5
        corner(32, circ)
        local b = Instance.new("UIStroke", circ)
        b.Thickness = 4; b.Color = C.green
    end
    marcaParte = p
end
crearMarca()

local function mostrarMarca(pos, isStrike)
    if not State.pitchPredict or not marcaParte then return end
    if not strikeZone then return end
    -- Posicionar el círculo en la strike zone en la posición de la pelota
    marcaParte.CFrame = CFrame.new(pos.X, pos.Y, strikeZone.Position.Z)
    local col = isStrike and C.green or C.red
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
--  AUTO SWING
-- ============================================================
local function hacerSwing(ball)
    if not Remote_SwingBat then return end
    if swingDone then return end

    -- Verificar que somos el bateador activo
    local currentBatter = GameVals and GameVals:FindFirstChild("CurrentBatter")
    if currentBatter and currentBatter.Value ~= LP then return end

    swingDone = true

    local ballPos = ball.Position
    local dir     = ball:GetAttribute("Direction") or Vector3.new(0, 0, -1)

    -- SwingBat:FireServer(aimPos, ballPos, direction, hitType)
    -- aimPos = misma posición de la pelota = hit perfecto
    Remote_SwingBat:FireServer(ballPos, ballPos, dir, "Power")
end

-- ============================================================
--  LOOP PRINCIPAL
-- ============================================================
local aimActual = Vector3.new(0, 3, 0)

RunService.RenderStepped:Connect(function(dt)
    -- Buscar pelota activa si no hay una
    if not (ballPart and ballPart.Parent) then
        ballPart = buscarPelota()
    end

    local ball = ballPart

    if ball and ball.Parent then
        local ballPos   = ball.Position
        local isStrike_ = esStrike(ballPos)

        -- Suavizar aim
        aimActual = aimActual:Lerp(ballPos, math.clamp(dt * 10, 0, 1))

        -- UI
        local speed = ball:GetAttribute("Speed") or ball:GetAttribute("Velocity")
        lbTipo.Text       = ball:GetAttribute("PitchType") or "⚾"
        lbSpeed.Text      = speed and (math.floor(speed) .. " mph") or ""
        lbZona.Text       = isStrike_ and "STRIKE ✓" or "BOLA ✗"
        lbZona.TextColor3 = isStrike_ and C.green or C.red

        -- Distancia al plato
        if strikeZone then
            local dist = math.abs(ballPos.Z - strikeZone.Position.Z)
            lbDist.Text       = string.format("%.1f studs", dist)
            lbDist.TextColor3 = dist < 5 and C.red or dist < 15 and C.yellow or C.muted
        end

        -- Borde del círculo
        accentRing.Color = locked and C.yellow
                        or isStrike_ and C.green
                        or C.red

        -- Pitch predictor
        mostrarMarca(aimActual, isStrike_)

        -- Auto Swing — solo strikes
        if State.autoSwing and isStrike_ and not swingDone then
            -- Swingear cuando la pelota está cerca del plato
            if strikeZone then
                local dist = math.abs(ballPos.Z - strikeZone.Position.Z)
                if dist < 8 then
                    hacerSwing(ball)
                end
            end
        end

    else
        -- Sin pelota
        lbTipo.Text        = "⚾"
        lbSpeed.Text       = ""
        lbZona.Text        = "·"
        lbZona.TextColor3  = C.muted
        lbDist.Text        = "esperando..."
        lbDist.TextColor3  = C.muted
        accentRing.Color   = locked and C.yellow or C.border
        ocultarMarca()

        -- Field tracker
        if State.fieldTrack then
            local char = LP.Character
            local hrp  = char and char:FindFirstChild("HumanoidRootPart")
            local BallHolder = workspace:FindFirstChild("BallHolder")
            local liveBall = BallHolder and BallHolder:FindFirstChildOfClass("Part")
            if hrp and liveBall then
                local dist = (liveBall.Position - hrp.Position).Magnitude
                lbDist.Text       = string.format("🏃 %.1f studs", dist)
                lbDist.TextColor3 = dist < 15 and C.yellow or C.muted
            end
        end
    end
end)

print("[SB Hack] ✅ Cargado — Superstar Baseball")

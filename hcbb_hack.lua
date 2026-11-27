-- ============================================================
--   HCBB 9v9 2.0 - SCRIPT
--   Auto Swing (solo strikes) · Pitch Predictor · Field Tracker
--   Basado en ingeniería inversa de Scripts_7830150255.rbxlx
--   (Pitch23, Physics, PitchGUI, workspace.PP, workspace.Plates)
-- ============================================================

local Players      = game:GetService("Players")
local RunService   = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local UIS          = game:GetService("UserInputService")
local VIM          = game:GetService("VirtualInputManager")
local LP           = Players.LocalPlayer
local CAM          = workspace.CurrentCamera

-- ── Constantes exactas de HCBB 9v9 2.0 (Pitch23 / Physics) ──
local HIT_GRAV     = -58.86
local HALF_HG      = HIT_GRAV / 2
local DOUBLE_HG    = HIT_GRAV * 2
local PITCH_GRAV   = -9.866   -- FB / LH / RH / KN (CU/SL usan -18.499)
local SWING_WINDOW = 0.6317   -- Ventana X de contacto en el LocalScript

-- ── Referencias del campo ─────────────────────────────────
local Plates      = workspace:WaitForChild("Plates", 15)
local PP          = workspace:WaitForChild("PP", 15)
local IgnoreF     = workspace:FindFirstChild("Ignore")
local HomePlate   = Plates and Plates:WaitForChild("Home", 10)
local MoundPlate  = Plates and Plates:WaitForChild("Mound", 10)
local SwingTarget = Plates and Plates:WaitForChild("SwingTarget", 10)
local MouseTarget = Plates and Plates:WaitForChild("MouseTarget", 10)

if not Plates or not PP or not HomePlate then
    warn("[HCBB] No se encontraron Plates / PP / Home")
    return
end

-- Dirección del pitcheo (Mound -> Home)
local pitchDirUnit = ((HomePlate.Position - MoundPlate.Position) * Vector3.new(1, 0, 1)).Unit

-- ── Estado ────────────────────────────────────────────────
local State = {
    autoSwing    = false,
    pitchPredict = true,
    fieldTrack   = true,
}

local ballPart     = nil
local prevBallPos  = nil
local ballVel      = Vector3.zero
local swingDone    = false
local isFieldBall  = false
local aimActual    = SwingTarget and SwingTarget.Position or HomePlate.Position + Vector3.new(0, 3, 0)

-- ── Colores ───────────────────────────────────────────────
local C = {
    bg      = Color3.fromRGB(10,  13,  22),
    dark    = Color3.fromRGB(14,  18,  32),
    border  = Color3.fromRGB(50,  65, 100),
    accent  = Color3.fromRGB(80, 160, 255),
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
    return s
end

-- ── Buscar pelota real en workspace.PP (ignorar clones "LB") ──
local function buscarPelotaReal()
    for _, child in ipairs(PP:GetChildren()) do
        if child.Name == "Ball" and not child:FindFirstChild("LB") and child:IsA("BasePart") then
            return child
        end
    end
    return nil
end

-- ── Strike Zone real (workspace.Ignore["岐阜県"].BlackBoarder) ──
local function getStrikeBox()
    local ig = IgnoreF or workspace:FindFirstChild("Ignore")
    if not ig then return nil end
    local szModel = ig:FindFirstChild("\229\178\144\233\152\156\231\156\140")
    return szModel and szModel:FindFirstChild("BlackBoarder")
end

local function esStrike(pos)
    local box = getStrikeBox()
    if box and box:IsA("BasePart") then
        local lp = box.CFrame:PointToObjectSpace(pos)
        local half = box.Size / 2
        return math.abs(lp.Z) <= half.Z and math.abs(lp.Y) <= half.Y
    end
    -- Fallback alrededor de SwingTarget / Home si BlackBoarder aún no se clonó
    local ref = SwingTarget or MouseTarget or HomePlate
    local dz = math.abs(pos.Z - ref.Position.Z)
    local dy = math.abs(pos.Y - (HomePlate.Position.Y + 2.8))
    return dz <= 1.35 and dy <= 1.45
end

-- ============================================================
--  GUI — PANEL CIRCULAR
-- ============================================================
local Gui = Instance.new("ScreenGui")
Gui.Name           = "HCBB_Hack"
Gui.ResetOnSpawn   = false
Gui.IgnoreGuiInset = true
Gui.DisplayOrder   = 50
Gui.Parent         = LP:WaitForChild("PlayerGui")

local Circle = Instance.new("Frame")
Circle.Name                   = "Circle"
Circle.AnchorPoint            = Vector2.new(0.5, 0.5)
Circle.Position               = UDim2.new(0.08, 0, 0.5, 0)
Circle.Size                   = UDim2.fromOffset(124, 124)
Circle.BackgroundColor3       = C.dark
Circle.BackgroundTransparency = 0.1
Circle.BorderSizePixel        = 0
Circle.Parent                 = Gui
corner(62, Circle)

local bgGrad = Instance.new("UIGradient", Circle)
bgGrad.Color    = ColorSequence.new(C.bg, Color3.fromRGB(18, 28, 52))
bgGrad.Rotation = 135

local accentRing = stroke(C.accent, 2.5, Circle)
accentRing.Transparency = 0.35

local lbModo = Instance.new("TextLabel")
lbModo.Size = UDim2.new(1, 0, 0, 24)
lbModo.Position = UDim2.new(0, 0, 0, 14)
lbModo.BackgroundTransparency = 1
lbModo.Font = Enum.Font.GothamBlack
lbModo.TextSize = 13
lbModo.TextColor3 = C.accent
lbModo.Text = "⚾ HCBB"
lbModo.Parent = Circle

local lbSpeed = Instance.new("TextLabel")
lbSpeed.Size = UDim2.new(1, 0, 0, 18)
lbSpeed.Position = UDim2.new(0, 0, 0, 38)
lbSpeed.BackgroundTransparency = 1
lbSpeed.Font = Enum.Font.GothamBold
lbSpeed.TextSize = 12
lbSpeed.TextColor3 = C.yellow
lbSpeed.Text = ""
lbSpeed.Parent = Circle

local lbZona = Instance.new("TextLabel")
lbZona.Size = UDim2.new(1, 0, 0, 20)
lbZona.Position = UDim2.new(0, 0, 0, 56)
lbZona.BackgroundTransparency = 1
lbZona.Font = Enum.Font.GothamBlack
lbZona.TextSize = 13
lbZona.TextColor3 = C.muted
lbZona.Text = "·"
lbZona.Parent = Circle

local lbDist = Instance.new("TextLabel")
lbDist.Size = UDim2.new(1, -10, 0, 16)
lbDist.Position = UDim2.new(0, 5, 0, 78)
lbDist.BackgroundTransparency = 1
lbDist.Font = Enum.Font.GothamBold
lbDist.TextSize = 10
lbDist.TextColor3 = C.muted
lbDist.Text = "esperando..."
lbDist.Parent = Circle

local lbDebug = Instance.new("TextLabel")
lbDebug.Size = UDim2.new(1, -10, 0, 14)
lbDebug.Position = UDim2.new(0, 5, 0, 95)
lbDebug.BackgroundTransparency = 1
lbDebug.Font = Enum.Font.Code
lbDebug.TextSize = 9
lbDebug.TextColor3 = C.muted
lbDebug.Text = "listo"
lbDebug.Parent = Circle

-- ── Botones debajo del círculo ─────────────────────────────
local BtnRow = Instance.new("Frame")
BtnRow.AnchorPoint = Vector2.new(0.5, 0)
BtnRow.Position    = UDim2.new(0.5, 0, 1, 8)
BtnRow.Size        = UDim2.fromOffset(124, 30)
BtnRow.BackgroundTransparency = 1
BtnRow.Parent      = Circle

local BtnLayout = Instance.new("UIListLayout", BtnRow)
BtnLayout.FillDirection       = Enum.FillDirection.Horizontal
BtnLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
BtnLayout.Padding             = UDim.new(0, 6)

local function makeBtn(icon, active, onClick)
    local btn = Instance.new("TextButton")
    btn.Size                   = UDim2.fromOffset(28, 28)
    btn.BackgroundColor3       = active and C.accent or C.dark
    btn.BackgroundTransparency = active and 0.1 or 0.5
    btn.Text                   = icon
    btn.TextSize               = 14
    btn.Font                   = Enum.Font.GothamBold
    btn.TextColor3             = C.white
    btn.BorderSizePixel        = 0
    btn.Parent                 = BtnRow
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

-- ── Botón candado + Drag ───────────────────────────────────
local locked = false
local LockBtn = Instance.new("TextButton")
LockBtn.AnchorPoint            = Vector2.new(1, 0)
LockBtn.Position               = UDim2.new(1, -2, 0, 2)
LockBtn.Size                   = UDim2.fromOffset(22, 22)
LockBtn.BackgroundColor3       = C.dark
LockBtn.BackgroundTransparency = 0.3
LockBtn.Text                   = "🔓"
LockBtn.TextSize               = 11
LockBtn.Font                   = Enum.Font.GothamBold
LockBtn.TextColor3             = C.white
LockBtn.BorderSizePixel        = 0
LockBtn.ZIndex                 = 10
LockBtn.Parent                 = Circle
corner(11, LockBtn)
stroke(C.border, 1, LockBtn)

LockBtn.MouseButton1Click:Connect(function()
    locked = not locked
    LockBtn.Text             = locked and "🔒" or "🔓"
    LockBtn.BackgroundColor3 = locked and C.yellow or C.dark
    tween(LockBtn, 0.15, { BackgroundTransparency = locked and 0.1 or 0.3 })
    accentRing.Color = locked and C.yellow or C.accent
end)

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
--  MARCA CIRCULAR TRANSPARENTE (Pitch Predictor)
-- ============================================================
local pitchMarker = nil

local function crearPitchMarker()
    local p = Instance.new("Part")
    p.Name         = "HCBB_PitchMarker"
    p.Anchored     = true
    p.CanCollide   = false
    p.CanQuery     = false
    p.CanTouch     = false
    p.CastShadow   = false
    p.Size         = Vector3.new(0.05, 0.78, 0.78)
    p.Transparency = 1
    p.Parent       = workspace

    for _, face in ipairs({Enum.NormalId.Left, Enum.NormalId.Right}) do
        local sg = Instance.new("SurfaceGui", p)
        sg.Face           = face
        sg.SizingMode     = Enum.SurfaceGuiSizingMode.FixedSize
        sg.CanvasSize     = Vector2.new(64, 64)
        sg.LightInfluence = 0
        sg.AlwaysOnTop    = true
        sg.Enabled        = false

        local circ = Instance.new("Frame", sg)
        circ.AnchorPoint            = Vector2.new(0.5, 0.5)
        circ.Position               = UDim2.fromScale(0.5, 0.5)
        circ.Size                   = UDim2.new(1, -6, 1, -6)
        circ.BackgroundColor3       = C.green
        circ.BackgroundTransparency = 0.85
        corner(32, circ)
        local st = Instance.new("UIStroke", circ)
        st.Thickness = 5
        st.Color     = C.green
    end
    return p
end
pitchMarker = crearPitchMarker()

local function mostrarPitchMarker(pos, strike)
    if not State.pitchPredict or not pitchMarker then return end
    local refX = (SwingTarget or MouseTarget or HomePlate).Position.X
    pitchMarker.CFrame = CFrame.new(refX, pos.Y, pos.Z)
    local col = strike and C.green or C.red
    for _, sg in ipairs(pitchMarker:GetChildren()) do
        if sg:IsA("SurfaceGui") then
            sg.Enabled = true
            local f = sg:FindFirstChildOfClass("Frame")
            if f then
                f.BackgroundColor3 = col
                local st = f:FindFirstChildOfClass("UIStroke")
                if st then st.Color = col end
            end
        end
    end
end

local function ocultarPitchMarker()
    if not pitchMarker then return end
    for _, sg in ipairs(pitchMarker:GetChildren()) do
        if sg:IsA("SurfaceGui") then sg.Enabled = false end
    end
end

-- ============================================================
--  MARCA DE CAÍDA EN EL CAMPO (Field Tracker)
-- ============================================================
local fieldMarker, fieldTimerLabel = nil, nil

local function crearFieldMarker()
    local p = Instance.new("Part")
    p.Name         = "HCBB_FieldMarker"
    p.Anchored     = true
    p.CanCollide   = false
    p.CanQuery     = false
    p.CanTouch     = false
    p.CastShadow   = false
    p.Size         = Vector3.new(3.2, 0.08, 3.2)
    p.Transparency = 1
    p.Parent       = workspace

    local sg = Instance.new("SurfaceGui", p)
    sg.Face           = Enum.NormalId.Top
    sg.SizingMode     = Enum.SurfaceGuiSizingMode.FixedSize
    sg.CanvasSize     = Vector2.new(128, 128)
    sg.LightInfluence = 0
    sg.AlwaysOnTop    = true
    sg.Enabled        = false

    local circ = Instance.new("Frame", sg)
    circ.AnchorPoint            = Vector2.new(0.5, 0.5)
    circ.Position               = UDim2.fromScale(0.5, 0.5)
    circ.Size                   = UDim2.new(1, -10, 1, -10)
    circ.BackgroundColor3       = C.yellow
    circ.BackgroundTransparency = 0.8
    corner(64, circ)
    local st = Instance.new("UIStroke", circ)
    st.Thickness = 7
    st.Color     = C.yellow

    local bb = Instance.new("BillboardGui", p)
    bb.Size        = UDim2.fromOffset(110, 32)
    bb.StudsOffset = Vector3.new(0, 2.5, 0)
    bb.AlwaysOnTop = true
    bb.Enabled     = false

    local lbl = Instance.new("TextLabel", bb)
    lbl.Size                   = UDim2.fromScale(1, 1)
    lbl.BackgroundColor3       = C.bg
    lbl.BackgroundTransparency = 0.25
    lbl.Font                   = Enum.Font.GothamBlack
    lbl.TextSize               = 13
    lbl.TextColor3             = C.yellow
    lbl.Text                   = "0.00s"
    corner(8, lbl)
    stroke(C.yellow, 1.5, lbl)

    return p, lbl
end
fieldMarker, fieldTimerLabel = crearFieldMarker()

local function mostrarFieldMarker(landingPos, tLeft)
    if not State.fieldTrack or not fieldMarker then return end
    fieldMarker.CFrame = CFrame.new(landingPos.X, HomePlate.Position.Y + 0.05, landingPos.Z)
    for _, g in ipairs(fieldMarker:GetChildren()) do
        if g:IsA("SurfaceGui") or g:IsA("BillboardGui") then
            g.Enabled = true
        end
    end
    if fieldTimerLabel then
        fieldTimerLabel.Text = string.format("⏱ %.2fs", math.max(0, tLeft))
    end
end

local function ocultarFieldMarker()
    if not fieldMarker then return end
    for _, g in ipairs(fieldMarker:GetChildren()) do
        if g:IsA("SurfaceGui") or g:IsA("BillboardGui") then
            g.Enabled = false
        end
    end
end

-- ============================================================
--  AUTO SWING (Solo Strikes)
-- ============================================================
local function hacerSwing(predPos)
    if swingDone then return end
    swingDone = true

    -- Mover cursor hacia la proyección en pantalla del punto de cruce
    local vp, onScreen = CAM:WorldToViewportPoint(predPos)
    if onScreen then
        VIM:SendMouseMoveEvent(vp.X, vp.Y, game)
    end

    -- Disparar click izquierdo real (el LocalScript de HCBB lo procesa como Swing)
    if mouse1click then
        mouse1click()
    else
        VIM:SendMouseButtonEvent(vp.X, vp.Y, 0, true, game, 1)
        task.defer(function()
            VIM:SendMouseButtonEvent(vp.X, vp.Y, 0, false, game, 1)
        end)
    end

    lbDebug.Text       = "SWING! ✓"
    lbDebug.TextColor3 = C.green
end

-- ── Listeners de workspace.PP ─────────────────────────────
PP.ChildAdded:Connect(function(child)
    if child.Name == "Ball" and not child:FindFirstChild("LB") and child:IsA("BasePart") then
        ballPart    = child
        prevBallPos = child.Position
        ballVel     = Vector3.zero
        swingDone   = false
        isFieldBall = false
        lbDebug.Text = "Nueva bola"
        lbDebug.TextColor3 = C.accent
    end
end)

PP.ChildRemoved:Connect(function(child)
    if child == ballPart then
        ballPart    = nil
        prevBallPos = nil
        ballVel     = Vector3.zero
        swingDone   = false
        isFieldBall = false
        ocultarPitchMarker()
        ocultarFieldMarker()
    end
end)

-- ============================================================
--  LOOP PRINCIPAL
-- ============================================================
RunService.RenderStepped:Connect(function(dt)
    if not (ballPart and ballPart.Parent) then
        ballPart = buscarPelotaReal()
        if ballPart then
            prevBallPos = ballPart.Position
            ballVel     = Vector3.zero
            swingDone   = false
        end
    end

    local ball = ballPart
    if not (ball and ball.Parent) then
        lbModo.Text       = "⚾ HCBB"
        lbSpeed.Text      = ""
        lbZona.Text       = "·"
        lbZona.TextColor3 = C.muted
        lbDist.Text       = "esperando..."
        lbDist.TextColor3 = C.muted
        accentRing.Color  = locked and C.yellow or C.border
        ocultarPitchMarker()
        ocultarFieldMarker()
        return
    end

    local pos = ball.Position
    if prevBallPos and dt > 0 then
        local instantVel = (pos - prevBallPos) / dt
        if instantVel.Magnitude > 1 then
            ballVel = ballVel:Lerp(instantVel, 0.55)
        end
    end
    prevBallPos = pos

    -- Detectar si es pitcheo (va hacia Home) o bola bateada (sale hacia el campo)
    local dotPitch = ballVel:Dot(pitchDirUnit)
    if dotPitch < -15 and ballVel.Magnitude > 20 then
        isFieldBall = true
    end

    if isFieldBall then
        -- ── MODO FIELD TRACKER (HitGrav = -58.86) ────────────
        ocultarPitchMarker()
        lbModo.Text = "🧤 FIELD"

        local dy   = HomePlate.Position.Y - pos.Y
        local disc = ballVel.Y * ballVel.Y + DOUBLE_HG * dy
        if disc >= 0 then
            local tLand = (-ballVel.Y - math.sqrt(disc)) / HIT_GRAV
            if tLand > 0 and tLand < 12 then
                local landingPos = pos + ballVel * tLand + Vector3.new(0, HALF_HG * (tLand * tLand), 0)
                mostrarFieldMarker(landingPos, tLand)

                local char = LP.Character
                local hrp  = char and char:FindFirstChild("HumanoidRootPart")
                local distPlayer = hrp and (landingPos - hrp.Position).Magnitude or 0

                lbSpeed.Text      = string.format("⏱ %.2fs", tLand)
                lbZona.Text       = "EN JUEGO"
                lbZona.TextColor3 = C.yellow
                lbDist.Text       = string.format("📍 %.1f studs", distPlayer)
                lbDist.TextColor3 = distPlayer < 15 and C.green or C.yellow
                accentRing.Color  = locked and C.yellow or C.yellow
            end
        end
    else
        -- ── MODO PITCH PREDICTOR & AUTO SWING ─────────────────
        ocultarFieldMarker()
        lbModo.Text = "🎯 PITCH"

        local targetRef = SwingTarget or MouseTarget or HomePlate
        local toTarget  = targetRef.Position - pos
        local distPlane = toTarget:Dot(pitchDirUnit)
        local speedToward = math.max(1, ballVel:Dot(pitchDirUnit))

        -- Proyección al cruzar el plano del plato
        local tToPlate = math.clamp(distPlane / speedToward, 0, 1.5)
        local predPos  = pos + ballVel * tToPlate + Vector3.new(0, 0.5 * PITCH_GRAV * (tToPlate * tToPlate), 0)
        aimActual      = aimActual:Lerp(predPos, math.clamp(dt * 18, 0, 1))

        local strike = esStrike(aimActual)
        local mph    = math.floor(ballVel.Magnitude * 0.6818)

        lbSpeed.Text      = mph > 15 and (mph .. " mph") or ""
        lbZona.Text       = strike and "STRIKE ✓" or "BOLA ✗"
        lbZona.TextColor3 = strike and C.green or C.red
        lbDist.Text       = string.format("%.1f studs", math.max(0, distPlane))
        lbDist.TextColor3 = distPlane < 6 and C.red or distPlane < 18 and C.yellow or C.muted
        accentRing.Color  = locked and C.yellow or (strike and C.green or C.red)

        if distPlane > -2 then
            mostrarPitchMarker(aimActual, strike)
        else
            ocultarPitchMarker()
        end

        -- Auto Swing: SOLO si es STRIKE y entra en la ventana de contacto
        if State.autoSwing and strike and not swingDone then
            local dx = math.abs(pos.X - targetRef.Position.X)
            if dx <= SWING_WINDOW or (tToPlate > 0 and tToPlate <= 0.045) then
                hacerSwing(aimActual)
            end
        elseif State.autoSwing and not strike and distPlane < 10 then
            lbDebug.Text       = "Dejando pasar bola"
            lbDebug.TextColor3 = C.muted
        end
    end
end)

print("[HCBB Hack] ✅ Cargado — Pitch Predictor · Auto Swing (Solo Strikes) · Field Tracker")

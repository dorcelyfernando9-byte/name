-- ============================================================
--   SUPERSTAR BASEBALL - HACK SCRIPT  v3
--   Ventana flotante · Neon Azul · Plegable · Delta
--   Auto Swing · Pitch Predictor · Field Track
-- ============================================================
local Players      = game:GetService("Players")
local RunService   = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local UIS          = game:GetService("UserInputService")
local LP           = Players.LocalPlayer
local RS           = game:GetService("ReplicatedStorage")

local Remotes  = RS:WaitForChild("RemoteEvents", 10)
local GameVals = RS:WaitForChild("GameValues",   10)
if not Remotes then warn("[SB] No RemoteEvents"); return end

local Remote_SwingBat = Remotes:WaitForChild("SwingBat", 10)

local BallHolder = workspace:WaitForChild("BallHolder", 10)
if not BallHolder then warn("[SB] No BallHolder"); return end

local ballPart   = nil
local swingDone  = false
local strikeZone = nil
local pitchTipo  = "—"
local pitchSpeed = "—"
local State = { autoSwing = false, pitchPredict = true, fieldTrack = true }

task.spawn(function()
    local p = workspace:WaitForChild("Pitching", 15)
    if p then strikeZone = p:WaitForChild("StrikeZone", 10) end
end)

-- ── Helpers ──────────────────────────────────────────────
local function tw(o, t, pr)
    TweenService:Create(o, TweenInfo.new(t, Enum.EasingStyle.Quad), pr):Play()
end
local function corner(r, p)
    Instance.new("UICorner", p).CornerRadius = UDim.new(0, r)
end

-- ── Colores ──────────────────────────────────────────────
local BG    = Color3.fromRGB(8,  11, 24)
local BG2   = Color3.fromRGB(16, 22, 48)
local BLUE  = Color3.fromRGB(80, 160, 255)
local PINK  = Color3.fromRGB(220, 60, 200)
local GREEN = Color3.fromRGB(50,  220, 130)
local YELL  = Color3.fromRGB(244, 196, 72)
local RED   = Color3.fromRGB(235, 55,  55)
local WHITE = Color3.fromRGB(230, 236, 250)
local MUTED = Color3.fromRGB(100, 120, 165)

-- ============================================================
--  GUI
-- ============================================================
local pGui = LP:WaitForChild("PlayerGui")
local oldGui = pGui:FindFirstChild("SBHackV3")
if oldGui then oldGui:Destroy() end

local Gui = Instance.new("ScreenGui")
Gui.Name           = "SBHackV3"
Gui.ResetOnSpawn   = false
Gui.IgnoreGuiInset = true
Gui.DisplayOrder   = 99
Gui.Parent         = pGui

local WIN_W    = 240
local WIN_FULL = 300   -- altura expandida
local WIN_MIN  = 38    -- altura plegada (solo header)

-- Ventana
local Win = Instance.new("Frame")
Win.Size                   = UDim2.fromOffset(WIN_W, WIN_FULL)
Win.Position               = UDim2.new(0.05, 0, 0.25, 0)
Win.BackgroundColor3       = BG
Win.BackgroundTransparency = 0.05
Win.BorderSizePixel        = 0
Win.ClipsDescendants       = true   -- necesario para el pliegue
Win.Parent                 = Gui
corner(14, Win)

local grad = Instance.new("UIGradient", Win)
grad.Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0, Color3.fromRGB(10, 15, 36)),
    ColorSequenceKeypoint.new(1, Color3.fromRGB(6,  9,  18)),
})
grad.Rotation = 140

local border = Instance.new("UIStroke", Win)
border.Color       = BLUE
border.Thickness   = 1.8
border.Transparency = 0.25

-- ── HEADER (siempre visible) ──────────────────────────────
local Header = Instance.new("Frame")
Header.Size             = UDim2.new(1, 0, 0, WIN_MIN)
Header.BackgroundColor3 = BG2
Header.BackgroundTransparency = 0.1
Header.BorderSizePixel  = 0
Header.ZIndex           = 5
Header.Parent           = Win
corner(14, Header)

-- Tapar esquinas inferiores del header
local hFix = Instance.new("Frame")
hFix.Size             = UDim2.new(1, 0, 0, 14)
hFix.Position         = UDim2.new(0, 0, 1, -14)
hFix.BackgroundColor3 = BG2
hFix.BackgroundTransparency = 0.1
hFix.BorderSizePixel  = 0
hFix.Parent           = Header

local titleLb = Instance.new("TextLabel")
titleLb.Size             = UDim2.new(1, -78, 1, 0)
titleLb.Position         = UDim2.new(0, 10, 0, 0)
titleLb.BackgroundTransparency = 1
titleLb.Font             = Enum.Font.GothamBlack
titleLb.TextSize         = 14
titleLb.TextColor3       = WHITE
titleLb.TextXAlignment   = Enum.TextXAlignment.Left
titleLb.Text             = "⚾  SB HACK"
titleLb.ZIndex           = 6
titleLb.Parent           = Header

-- Separador neon bajo el header
local sep0 = Instance.new("Frame")
sep0.Size             = UDim2.new(1, 0, 0, 1)
sep0.Position         = UDim2.new(0, 0, 0, WIN_MIN)
sep0.BackgroundColor3 = BLUE
sep0.BackgroundTransparency = 0.3
sep0.BorderSizePixel  = 0
sep0.Parent           = Win

-- ── BOTÓN PLEGAR  (─ / +) ────────────────────────────────
local collapsed = false
local ColBtn = Instance.new("TextButton")
ColBtn.Size             = UDim2.fromOffset(28, 28)
ColBtn.Position         = UDim2.new(1, -66, 0, 5)
ColBtn.BackgroundColor3 = Color3.fromRGB(20, 30, 70)
ColBtn.BackgroundTransparency = 0.1
ColBtn.Text             = "—"
ColBtn.TextSize         = 14
ColBtn.Font             = Enum.Font.GothamBlack
ColBtn.TextColor3       = BLUE
ColBtn.BorderSizePixel  = 0
ColBtn.ZIndex           = 10
ColBtn.Parent           = Header
corner(8, ColBtn)
local colStroke = Instance.new("UIStroke", ColBtn)
colStroke.Color = BLUE; colStroke.Thickness = 1.2; colStroke.Transparency = 0.4

ColBtn.MouseButton1Click:Connect(function()
    collapsed = not collapsed
    local h = collapsed and WIN_MIN or WIN_FULL
    ColBtn.Text = collapsed and "+" or "—"
    tw(Win, 0.25, { Size = UDim2.fromOffset(WIN_W, h) })
end)

-- ── BOTÓN LOCK ───────────────────────────────────────────
local locked = false
local LockBtn = Instance.new("TextButton")
LockBtn.Size             = UDim2.fromOffset(28, 28)
LockBtn.Position         = UDim2.new(1, -34, 0, 5)
LockBtn.BackgroundColor3 = Color3.fromRGB(20, 30, 70)
LockBtn.BackgroundTransparency = 0.1
LockBtn.Text             = "🔓"
LockBtn.TextSize         = 13
LockBtn.Font             = Enum.Font.GothamBold
LockBtn.TextColor3       = WHITE
LockBtn.BorderSizePixel  = 0
LockBtn.ZIndex           = 10
LockBtn.Parent           = Header
corner(8, LockBtn)
local lockStroke = Instance.new("UIStroke", LockBtn)
lockStroke.Color = BLUE; lockStroke.Thickness = 1.2; lockStroke.Transparency = 0.4

LockBtn.MouseButton1Click:Connect(function()
    locked = not locked
    LockBtn.Text = locked and "🔒" or "🔓"
    tw(border,     0.2, { Color = locked and YELL or BLUE })
    tw(colStroke,  0.2, { Color = locked and YELL or BLUE })
    tw(lockStroke, 0.2, { Color = locked and YELL or BLUE })
end)

-- ── DRAG (solo por header) ───────────────────────────────
do
    local drag, ds, sp = false, nil, nil
    Header.InputBegan:Connect(function(i)
        if locked then return end
        if i.UserInputType == Enum.UserInputType.MouseButton1
        or i.UserInputType == Enum.UserInputType.Touch then
            drag=true; ds=i.Position; sp=Win.Position
        end
    end)
    UIS.InputEnded:Connect(function(i)
        if i.UserInputType == Enum.UserInputType.MouseButton1
        or i.UserInputType == Enum.UserInputType.Touch then drag=false end
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

-- ── CONTENIDO (oculto al plegar) ─────────────────────────
local Content = Instance.new("Frame")
Content.Size             = UDim2.new(1, 0, 1, -WIN_MIN)
Content.Position         = UDim2.fromOffset(0, WIN_MIN)
Content.BackgroundTransparency = 1
Content.BorderSizePixel  = 0
Content.Parent           = Win

-- Tipo pitch
local lbTipo = Instance.new("TextLabel")
lbTipo.Size             = UDim2.new(1, 0, 0, 28)
lbTipo.Position         = UDim2.fromOffset(0, 8)
lbTipo.BackgroundTransparency = 1
lbTipo.Font             = Enum.Font.GothamBlack
lbTipo.TextSize         = 15
lbTipo.TextColor3       = BLUE
lbTipo.Text             = "⚾  —"
lbTipo.Parent           = Content

-- Velocidad
local lbSpeed = Instance.new("TextLabel")
lbSpeed.Size             = UDim2.new(1, 0, 0, 34)
lbSpeed.Position         = UDim2.fromOffset(0, 34)
lbSpeed.BackgroundTransparency = 1
lbSpeed.Font             = Enum.Font.GothamBlack
lbSpeed.TextSize         = 26
lbSpeed.TextColor3       = YELL
lbSpeed.Text             = "— mph"
lbSpeed.Parent           = Content

-- Strike / Bola
local lbZona = Instance.new("TextLabel")
lbZona.Size             = UDim2.new(1, 0, 0, 24)
lbZona.Position         = UDim2.fromOffset(0, 68)
lbZona.BackgroundTransparency = 1
lbZona.Font             = Enum.Font.GothamBlack
lbZona.TextSize         = 15
lbZona.TextColor3       = MUTED
lbZona.Text             = "· · ·"
lbZona.Parent           = Content

-- Separador
local sep1 = Instance.new("Frame")
sep1.Size             = UDim2.new(1, -30, 0, 1)
sep1.Position         = UDim2.fromOffset(15, 97)
sep1.BackgroundColor3 = BLUE
sep1.BackgroundTransparency = 0.6
sep1.BorderSizePixel  = 0
sep1.Parent           = Content

-- Distancia
local lbDist = Instance.new("TextLabel")
lbDist.Size             = UDim2.new(1, -20, 0, 16)
lbDist.Position         = UDim2.fromOffset(10, 103)
lbDist.BackgroundTransparency = 1
lbDist.Font             = Enum.Font.Code
lbDist.TextSize         = 10
lbDist.TextColor3       = MUTED
lbDist.Text             = "esperando pitch..."
lbDist.Parent           = Content

-- Debug
local lbDebug = Instance.new("TextLabel")
lbDebug.Size             = UDim2.new(1, -20, 0, 12)
lbDebug.Position         = UDim2.fromOffset(10, 119)
lbDebug.BackgroundTransparency = 1
lbDebug.Font             = Enum.Font.Code
lbDebug.TextSize         = 8
lbDebug.TextColor3       = Color3.fromRGB(50, 80, 140)
lbDebug.Text             = "cargando..."
lbDebug.Parent           = Content

-- Separador antes de botones
local sep2 = Instance.new("Frame")
sep2.Size             = UDim2.new(1, -20, 0, 1)
sep2.Position         = UDim2.fromOffset(10, 136)
sep2.BackgroundColor3 = BLUE
sep2.BackgroundTransparency = 0.5
sep2.BorderSizePixel  = 0
sep2.Parent           = Content

-- ── BOTONES ───────────────────────────────────────────────
-- 3 TextButton directos en Content, posición absoluta manual
-- Ancho: 68px cada uno, gap: 8px → total 68*3+8*2 = 220px
-- Margen: (240-220)/2 = 10px

local function makeBtn(xOff, ico, lbl, initOn, onChange)
    local btn = Instance.new("TextButton")
    btn.Size             = UDim2.fromOffset(68, 50)
    btn.Position         = UDim2.fromOffset(xOff, 144)
    -- Fondo SIEMPRE visible: BG2 con transparencia baja para inactivo
    btn.BackgroundColor3 = initOn and BLUE or BG2
    btn.BackgroundTransparency = initOn and 0.15 or 0.0
    btn.BorderSizePixel  = 0
    btn.AutoButtonColor  = false
    btn.Text             = ""
    btn.Parent           = Content
    corner(10, btn)

    -- Borde siempre visible
    local st = Instance.new("UIStroke", btn)
    st.Color       = initOn and BLUE or Color3.fromRGB(50, 80, 160)
    st.Thickness   = 1.5
    st.Transparency = 0

    -- Icono
    local icoLb = Instance.new("TextLabel")
    icoLb.Size             = UDim2.new(1, 0, 0, 26)
    icoLb.Position         = UDim2.fromOffset(0, 4)
    icoLb.BackgroundTransparency = 1
    icoLb.Font             = Enum.Font.GothamBold
    icoLb.TextSize         = 20
    icoLb.TextColor3       = initOn and WHITE or Color3.fromRGB(160, 180, 220)
    icoLb.Text             = ico
    icoLb.Parent           = btn

    -- Texto
    local txLb = Instance.new("TextLabel")
    txLb.Size             = UDim2.new(1, 0, 0, 14)
    txLb.Position         = UDim2.fromOffset(0, 30)
    txLb.BackgroundTransparency = 1
    txLb.Font             = Enum.Font.GothamBold
    txLb.TextSize         = 8
    txLb.TextColor3       = initOn and WHITE or MUTED
    txLb.Text             = lbl
    txLb.Parent           = btn

    local on = initOn
    btn.MouseButton1Click:Connect(function()
        on = not on
        tw(btn, 0.15, {
            BackgroundColor3       = on and BLUE or BG2,
            BackgroundTransparency = on and 0.15 or 0.0,
        })
        tw(st,   0.15, { Color = on and BLUE or Color3.fromRGB(50, 80, 160) })
        tw(icoLb,0.15, { TextColor3 = on and WHITE or Color3.fromRGB(160,180,220) })
        tw(txLb, 0.15, { TextColor3 = on and WHITE or MUTED })
        onChange(on)
    end)
    return btn
end

makeBtn(10,  "🏏", "AUTO SWING",  State.autoSwing,    function(v) State.autoSwing    = v end)
makeBtn(86,  "🎯", "PREDICTOR",   State.pitchPredict,  function(v) State.pitchPredict = v end)
makeBtn(162, "🧤", "FIELD TRK",   State.fieldTrack,    function(v) State.fieldTrack   = v end)

-- ── STATUS BAR ────────────────────────────────────────────
local StatusBar = Instance.new("Frame")
StatusBar.Size             = UDim2.new(1, 0, 0, 22)
StatusBar.Position         = UDim2.new(0, 0, 1, -22)
StatusBar.BackgroundColor3 = BG2
StatusBar.BackgroundTransparency = 0.1
StatusBar.BorderSizePixel  = 0
StatusBar.Parent           = Content
corner(10, StatusBar)

local lbStatus = Instance.new("TextLabel")
lbStatus.Size             = UDim2.fromScale(1, 1)
lbStatus.BackgroundTransparency = 1
lbStatus.Font             = Enum.Font.Code
lbStatus.TextSize         = 9
lbStatus.TextColor3       = MUTED
lbStatus.Text             = "⬤  Esperando..."
lbStatus.Parent           = StatusBar

-- ============================================================
--  PITCH PREDICTOR 3D
-- ============================================================
local marcaParte = nil
local function crearMarca()
    if marcaParte then pcall(function() marcaParte:Destroy() end) end
    local p = Instance.new("Part")
    p.Anchored=true; p.CanCollide=false; p.CanQuery=false
    p.CanTouch=false; p.CastShadow=false
    p.Size=Vector3.new(0.72,0.72,0.04)
    p.Material=Enum.Material.Neon
    p.Color=GREEN; p.Transparency=1
    p.Parent=workspace
    for _, face in ipairs({Enum.NormalId.Front, Enum.NormalId.Back}) do
        local sg=Instance.new("SurfaceGui",p)
        sg.Face=face; sg.SizingMode=Enum.SurfaceGuiSizingMode.FixedSize
        sg.CanvasSize=Vector2.new(64,64)
        sg.LightInfluence=0; sg.AlwaysOnTop=true; sg.Enabled=false
        local f=Instance.new("Frame",sg)
        f.AnchorPoint=Vector2.new(0.5,0.5)
        f.Position=UDim2.fromScale(0.5,0.5)
        f.Size=UDim2.new(1,-4,1,-4)
        f.BackgroundColor3=GREEN; f.BackgroundTransparency=0.5
        corner(32,f)
        local b=Instance.new("UIStroke",f); b.Thickness=4; b.Color=GREEN
    end
    marcaParte=p
end
crearMarca()

local function mostrarMarca(pos, isStrike)
    if not State.pitchPredict or not marcaParte or not strikeZone then return end
    marcaParte.CFrame=CFrame.new(pos.X,pos.Y,strikeZone.Position.Z)
    local col=isStrike and GREEN or RED
    marcaParte.Color=col; marcaParte.Transparency=0.5
    for _,sg in ipairs(marcaParte:GetChildren()) do
        if sg:IsA("SurfaceGui") then
            sg.Enabled=true
            local f=sg:FindFirstChildOfClass("Frame")
            if f then f.BackgroundColor3=col
                local s=f:FindFirstChildOfClass("UIStroke") if s then s.Color=col end
            end
        end
    end
end
local function ocultarMarca()
    if not marcaParte then return end
    marcaParte.Transparency=1
    for _,sg in ipairs(marcaParte:GetChildren()) do
        if sg:IsA("SurfaceGui") then sg.Enabled=false end
    end
end

-- ============================================================
--  LÓGICA
-- ============================================================
local function predecirPitch(ball)
    if not strikeZone then return false, ball.Position, math.huge end
    local lPos = strikeZone.CFrame:PointToObjectSpace(ball.Position)
    local h = strikeZone.Size / 2
    local distZ = math.abs(lPos.Z)

    local vel = ball.AssemblyLinearVelocity
    local predX, predY = lPos.X, lPos.Y
    if vel.Magnitude > 5 then
        local lVel = strikeZone.CFrame:VectorToObjectSpace(vel)
        if lPos.Z * lVel.Z < 0 and math.abs(lVel.Z) > 1 then
            local t = math.clamp(-lPos.Z / lVel.Z, 0, 2)
            predX = lPos.X + lVel.X * t
            predY = lPos.Y + lVel.Y * t
        end
    end

    local isStrike = math.abs(predX) <= h.X and math.abs(predY) <= h.Y
    local worldAim = strikeZone.CFrame:PointToWorldSpace(Vector3.new(predX, predY, 0))
    return isStrike, worldAim, distZ
end

local function hacerSwing(ball)
    if not Remote_SwingBat or swingDone then return end
    local cb=GameVals and GameVals:FindFirstChild("CurrentBatter")
    if cb and cb.Value~=LP then return end
    swingDone=true
    lbDebug.Text="💥 SWING!"; lbDebug.TextColor3=GREEN
    Remote_SwingBat:FireServer(ball.Position, ball.Position,
        ball:GetAttribute("Direction") or Vector3.new(0,0,-1), "Power")
    task.delay(0.4, function() lbDebug.TextColor3=Color3.fromRGB(50,80,140) end)
end

BallHolder.ChildAdded:Connect(function(c)
    if c:IsA("BasePart") then ballPart=c; swingDone=false end
end)
BallHolder.ChildRemoved:Connect(function(c)
    if c==ballPart then ballPart=nil; swingDone=false end
end)

local Remote_PitchBall = Remotes:FindFirstChild("PitchBall") or Remotes:WaitForChild("PitchBall", 10)
if Remote_PitchBall then
    Remote_PitchBall.OnClientEvent:Connect(function(ball,_,_,_,_,ability,_,speed,throwStyle)
        pitchTipo  = throwStyle or ability or "Normal"
        pitchSpeed = speed and (math.floor(speed*100).." mph") or "—"
        ballPart=ball; swingDone=false
    end)
end

-- ── LOOP ─────────────────────────────────────────────────
local aimActual = Vector3.new(0,3,0)

RunService.RenderStepped:Connect(function(dt)
    if not (ballPart and ballPart.Parent) then
        ballPart = BallHolder:FindFirstChild("Baseball")
                or BallHolder:FindFirstChildOfClass("Part")
                or BallHolder:FindFirstChildOfClass("MeshPart")
    end
    local ball = ballPart
    if ball and ball.Parent then
        local ok, targetAim, d = predecirPitch(ball)
        aimActual = aimActual:Lerp(targetAim, math.clamp(dt*12, 0, 1))
        lbTipo.Text        = "⚾  "..pitchTipo
        lbSpeed.Text       = pitchSpeed
        lbZona.Text        = ok and "✓  STRIKE" or "✗  BOLA"
        lbZona.TextColor3  = ok and GREEN or RED
        border.Color       = ok and GREEN or BLUE
        lbStatus.Text      = "⬤  "..ball.Name
        lbStatus.TextColor3= GREEN

        local cb = GameVals and GameVals:FindFirstChild("CurrentBatter")
        local isBatting = not cb or cb.Value == LP
        if State.fieldTrack and not isBatting then
            local char = LP.Character
            local hrp = char and char:FindFirstChild("HumanoidRootPart")
            if hrp then
                local fd = (ball.Position - hrp.Position).Magnitude
                lbDist.Text = "🏃 "..string.format("%.1f", fd).." studs"
                lbDist.TextColor3 = fd < 15 and YELL or MUTED
            end
        elseif strikeZone then
            lbDist.Text      = string.format("📍 %.1f studs al plato", d)
            lbDist.TextColor3= d<5 and RED or d<15 and YELL or MUTED
        end

        if State.pitchPredict then
            mostrarMarca(aimActual, ok)
        else
            ocultarMarca()
        end

        if State.autoSwing and ok and not swingDone and strikeZone then
            if d < 8 then hacerSwing(ball) end
        end
    else
        lbTipo.Text="⚾  —"; lbSpeed.Text="— mph"
        lbZona.Text="· · ·"; lbZona.TextColor3=MUTED
        border.Color=locked and YELL or BLUE
        lbStatus.Text="⬤  Esperando..."; lbStatus.TextColor3=MUTED
        lbDist.Text="esperando pitch..."
        lbDist.TextColor3=MUTED
        ocultarMarca()
    end
end)

lbDebug.Text = "cargado ✓"
print("[SB Hack v3] ✅")

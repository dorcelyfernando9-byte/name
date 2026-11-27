-- ============================================================
--   SÚPER MEGA BATEADOR - SCRIPT
--   Interfaz circular · Auto Swing solo strikes · Pitch Predictor
-- ============================================================

local Players      = game:GetService("Players")
local RunService   = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local UIS          = game:GetService("UserInputService")
local LP           = Players.LocalPlayer
local CAM          = workspace.CurrentCamera

-- ── Recursos del juego ────────────────────────────────────
local SMB = game:GetService("ReplicatedStorage"):WaitForChild("SMB", 15)
if not SMB then warn("[SMB] No encontrado"); return end

local Remotes          = SMB:WaitForChild("Remotes", 10)
local Pelota           = require(SMB:WaitForChild("Pelota"))
local Config           = require(SMB:WaitForChild("Config"))
local CFG_BAT          = Config.BATEO or {}
local Remote_Lanzamiento = Remotes:WaitForChild("Lanzamiento", 10)
local Remote_Swing       = Remotes:WaitForChild("Swing", 10)
local Remote_SwingPrac   = Remotes:FindFirstChild("SwingPractica")
local Remote_Lanzar      = Remotes:FindFirstChild("Lanzar")

local ZPLATO = Pelota.ZPlato or 1.2
local ZONA   = Pelota.Zona or { xMin=-1.4, xMax=1.4, yMin=1.5, yMax=4.3 }

-- ── Constantes Home Run (Config.BATEO / Bateo) ───────────
-- Offset -0.26 studs mantiene RadioPerfecto (<=0.35), da ~26.8° de elevación
-- y con dt=0 + "Poder" (1.06x vel) maximiza la probabilidad de jonrón.
local HR_ELEV_OFFSET = 0.26

-- ── Estado ───────────────────────────────────────────────
local lanzActual  = nil
local swingUsado  = {}
local aimActual   = Vector2.new(0, (ZONA.yMin + ZONA.yMax) / 2)
local State = {
    autoSwing    = false,
    perfectPitch = false,
    pitchPredict = true,
    fieldTrack   = true,
    autoField    = false,
}

-- ── Lanzamiento del servidor ──────────────────────────────
Remote_Lanzamiento.OnClientEvent:Connect(function(data)
    if type(data) ~= "table" then return end
    lanzActual = data
    if data.id then swingUsado[data.id] = nil end
end)

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

-- ============================================================
--  GUI — CÍRCULO PRINCIPAL
-- ============================================================
local Gui = Instance.new("ScreenGui")
Gui.Name           = "SMB_Hack"
Gui.ResetOnSpawn   = false
Gui.IgnoreGuiInset = true
Gui.DisplayOrder   = 50
Gui.Parent         = LP:WaitForChild("PlayerGui")

-- Círculo principal (contenedor)
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
stroke(C.border, 2, Circle)

-- Degradado de fondo
local bgGrad = Instance.new("UIGradient", Circle)
bgGrad.Color    = ColorSequence.new(C.bg, Color3.fromRGB(18, 28, 52))
bgGrad.Rotation = 135

-- Línea de acento en el borde
local accentRing = Instance.new("UIStroke", Circle)
accentRing.Color     = C.accent
accentRing.Thickness = 2.5
accentRing.Transparency = 0.4

-- ── Texto tipo de lanzamiento ─────────────────────────────
local lbTipo = Instance.new("TextLabel")
lbTipo.Size                = UDim2.new(1, 0, 0, 28)
lbTipo.Position            = UDim2.new(0, 0, 0, 16)
lbTipo.BackgroundTransparency = 1
lbTipo.Font                = Enum.Font.GothamBlack
lbTipo.TextSize             = 16
lbTipo.TextColor3           = C.accent
lbTipo.Text                 = "—"
lbTipo.Parent               = Circle

-- ── Texto mph ─────────────────────────────────────────────
local lbMph = Instance.new("TextLabel")
lbMph.Size                = UDim2.new(1, 0, 0, 20)
lbMph.Position            = UDim2.new(0, 0, 0, 42)
lbMph.BackgroundTransparency = 1
lbMph.Font                = Enum.Font.GothamBold
lbMph.TextSize             = 13
lbMph.TextColor3           = C.yellow
lbMph.Text                 = "— mph"
lbMph.Parent               = Circle

-- ── Indicador STRIKE / BOLA ───────────────────────────────
local lbZona = Instance.new("TextLabel")
lbZona.Size                = UDim2.new(1, 0, 0, 20)
lbZona.Position            = UDim2.new(0, 0, 0, 62)
lbZona.BackgroundTransparency = 1
lbZona.Font                = Enum.Font.GothamBlack
lbZona.TextSize             = 13
lbZona.TextColor3           = C.muted
lbZona.Text                 = "·"
lbZona.Parent               = Circle

-- ── Tiempo restante ───────────────────────────────────────
local lbTiempo = Instance.new("TextLabel")
lbTiempo.Size                = UDim2.new(1, -10, 0, 16)
lbTiempo.Position            = UDim2.new(0, 5, 0, 82)
lbTiempo.BackgroundTransparency = 1
lbTiempo.Font                = Enum.Font.Gotham
lbTiempo.TextSize             = 10
lbTiempo.TextColor3           = C.muted
lbTiempo.Text                 = "esperando..."
lbTiempo.Parent               = Circle

-- ── Botones pequeños abajo del círculo ────────────────────
-- Contenedor de botones
local BtnRow = Instance.new("Frame")
BtnRow.AnchorPoint      = Vector2.new(0.5, 0)
BtnRow.Position         = UDim2.new(0.5, 0, 1, 8)
BtnRow.Size             = UDim2.fromOffset(170, 30)
BtnRow.BackgroundTransparency = 1
BtnRow.Parent           = Circle

local BtnLayout = Instance.new("UIListLayout", BtnRow)
BtnLayout.FillDirection       = Enum.FillDirection.Horizontal
BtnLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
BtnLayout.Padding             = UDim.new(0, 4)

local function makeBtn(icon, active, onClick)
    local btn = Instance.new("TextButton")
    btn.Size                = UDim2.fromOffset(28, 28)
    btn.BackgroundColor3    = active and C.accent or C.dark
    btn.BackgroundTransparency = active and 0.3 or 0.3
    btn.Text                = icon
    btn.TextSize            = 14
    btn.Font                = Enum.Font.GothamBold
    btn.TextColor3          = C.white
    btn.BorderSizePixel     = 0
    btn.Parent              = BtnRow
    corner(14, btn)
    stroke(C.border, 1, btn)

    local isActive = active
    btn.MouseButton1Click:Connect(function()
        isActive = not isActive
        btn.BackgroundColor3 = isActive and C.accent or C.dark
        tween(btn, 0.1, { BackgroundTransparency = isActive and 0.1 or 0.5 })
        onClick(isActive)
    end)
    return btn, function() return isActive end
end

local btnSwing,  getSwing  = makeBtn("🏏", State.autoSwing,    function(v) State.autoSwing = v end)
local btnPitch,  getPitch  = makeBtn("⚡", State.perfectPitch, function(v) State.perfectPitch = v end)
local btnPredict,getPredict= makeBtn("🎯", State.pitchPredict, function(v) State.pitchPredict = v end)
local btnField,  getField  = makeBtn("🧤", State.fieldTrack,   function(v) State.fieldTrack = v end)
local btnRun,    getRun    = makeBtn("🏃", State.autoField,    function(v) State.autoField = v end)

-- ── Botón candado (bloquear movimiento) ───────────────────
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
    accentRing.Color       = locked and C.yellow or C.accent
end)

-- ── Drag del círculo ──────────────────────────────────────
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
    p.Name         = "SMBMarca"
    p.Anchored     = true
    p.CanCollide   = false
    p.CanQuery     = false
    p.CanTouch     = false
    p.CastShadow   = false
    -- Plano fino vertical, sin rotación — queda de frente al bateador
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
        b.Transparency = 0
    end
    marcaParte = p
end
crearMarca()

local function mostrarMarca(x, y, esStrike)
    if not State.pitchPredict or not marcaParte then return end
    -- Sin rotación — el Part queda plano de frente al bateador
    marcaParte.CFrame = CFrame.new(x, y, ZPLATO + 0.03)
    local col = esStrike and C.green or C.red
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
--  PERFECT PITCH HOOK (105 MPH + 0 Dispersión)
-- ============================================================
if hookmetamethod and getnamecallmethod then
    pcall(function()
        local oldNamecall
        oldNamecall = hookmetamethod(game, "__namecall", function(self, ...)
            local method = getnamecallmethod()
            if State.perfectPitch and method == "FireServer" and Remote_Lanzar and self == Remote_Lanzar then
                local args = { ... }
                -- Lanzar:FireServer(tipo, x, y, precision, potencia, ...)
                if #args >= 5 then
                    args[4] = 1 -- precision = 1.0 (>= 0.93 activa perfecto = true, 105 mph)
                    args[5] = 1 -- potencia = 1.0 (máxima velocidad)
                    return oldNamecall(self, table.unpack(args))
                end
            end
            return oldNamecall(self, ...)
        end)
    end)
end

-- ============================================================
--  AUTO SWING — MODO JONRÓN (Solo Strikes, dt = 0, Sweet Spot)
-- ============================================================
local function hacerSwing(lanz, esPractica)
    local remote = esPractica and Remote_SwingPrac or Remote_Swing
    if not remote then return end
    if swingUsado[lanz.id] then return end
    if not esPractica and SMB:GetAttribute("BateadorId") ~= LP.UserId then return end

    local ahora = workspace:GetServerTimeNow()
    if ahora < lanz.inicio + 0.08 then return end

    -- Solo swingear si es STRIKE
    local esStrike = Pelota.EnZona(lanz.pT.X, lanz.pT.Y)
    if not esStrike then return end

    swingUsado[lanz.id] = true

    -- Apuntar ligeramente debajo del centro (HR_ELEV_OFFSET) para ángulo óptimo ~26.8°
    -- manteniendo RadioPerfecto (<= 0.35) y dt = 0 exacto
    local aimX = lanz.pT.X
    local aimY = lanz.pT.Y - HR_ELEV_OFFSET
    remote:FireServer(lanz.id, 0, aimX, aimY, "Poder")
end

-- ============================================================
--  LOOP PRINCIPAL
-- ============================================================
RunService.RenderStepped:Connect(function(dt)
    local lanz = lanzActual

    if lanz and lanz.pT and lanz.inicio and lanz.T then
        local ahora     = workspace:GetServerTimeNow()
        local tRestante = (lanz.inicio + lanz.T) - ahora
        local esStrike  = Pelota.EnZona(lanz.pT.X, lanz.pT.Y)

        -- Suavizar aim
        local vel = math.clamp(dt * (tRestante < 0.3 and 18 or 8), 0, 1)
        aimActual = aimActual:Lerp(Vector2.new(lanz.pT.X, lanz.pT.Y), vel)

        -- UI
        lbTipo.Text      = lanz.tipo or lanz.nombre or "?"
        lbMph.Text       = (lanz.mph or "?") .. " mph"
        lbZona.Text      = esStrike and "STRIKE ✓" or "BOLA ✗"
        lbZona.TextColor3= esStrike and C.green or C.red

        -- Cambiar borde del círculo según strike/bola
        accentRing.Color = locked and C.yellow
                        or esStrike and C.green
                        or C.red

        if tRestante > 0.01 then
            lbTiempo.Text       = string.format("%.2fs", tRestante)
            lbTiempo.TextColor3 = tRestante < 0.2 and C.red
                               or tRestante < 0.4 and C.yellow
                               or C.muted
        else
            lbTiempo.Text       = "·"
            lbTiempo.TextColor3 = C.muted
        end

        -- Pitch predictor
        mostrarMarca(aimActual.X, aimActual.Y, esStrike)

        -- Auto swing — SOLO STRIKES (juego real + jaula de práctica)
        if State.autoSwing then
            local bateadorId = SMB:GetAttribute("BateadorId")
            local esBater    = bateadorId == LP.UserId
            local fase       = SMB:GetAttribute("FaseDuelo") or LP:GetAttribute("FaseDuelo")
            local enJuego    = fase == "Lanzando" or fase == "EnVuelo"
            -- FIX: en la jaula el atributo real es LP:GetAttribute("EnJaula") == true
            local enJaula    = LP:GetAttribute("EnJaula") == true or LP:GetAttribute("En1v1") == true
            local esPractica = enJaula and Remote_SwingPrac ~= nil

            if esBater and enJuego and not swingUsado[lanz.id] then
                -- Modo partido real
                if tRestante <= 0.04 and tRestante > -0.1 then
                    hacerSwing(lanz, false)
                end
            elseif esPractica and not swingUsado[lanz.id] then
                -- Modo jaula: swing cuando el lanzamiento está por llegar
                if tRestante <= 0.15 and tRestante > -0.2 then
                    hacerSwing(lanz, true)
                end
            end
        end
    else
        -- Sin pitch
        lbTipo.Text        = "⚾"
        lbMph.Text         = ""
        lbZona.Text        = "·"
        lbZona.TextColor3  = C.muted
        lbTiempo.Text      = "esperando..."
        lbTiempo.TextColor3= C.muted
        accentRing.Color   = locked and C.yellow or C.border
        ocultarMarca()
        aimActual = Vector2.new(0, (ZONA.yMin + ZONA.yMax) / 2)
    end
    -- ── Field Tracker + Auto-Field ────────────────────────
    -- FIX: SMB_Local vive en workspace.CurrentCamera como hijo directo
    --      La pelota puede estar en workspace también (Part "Pelota" o "BatazoFX")
    --      MarcaCaida es un Cylinder Neon que aparece antes del impacto
    if State.fieldTrack or State.autoField then
        local posAttr    = LP:GetAttribute("Posicion")
        local bateadorId = SMB:GetAttribute("BateadorId")
        local esBater    = bateadorId == LP.UserId
        -- No requiere posición específica: cualquier jugador no bateador puede usar field tracker
        local esDefensa  = not esBater

        if esDefensa and not LP:GetAttribute("CamRepeticion") then
            -- Buscar SMB_Local en CurrentCamera (donde el juego lo crea)
            local smbLocal = CAM:FindFirstChild("SMB_Local")

            -- Buscar la pelota — puede ser Pelota (en vuelo) o MarcaCaida (cayendo)
            local marcaCaida = smbLocal and smbLocal:FindFirstChild("MarcaCaida")
            local pelotaPart = smbLocal and smbLocal:FindFirstChild("Pelota")

            -- También buscar directamente en workspace (algunas versiones la ponen ahí)
            local pelotaWS = workspace:FindFirstChild("Pelota") or workspace:FindFirstChild("BatazoFX")

            -- Preferir MarcaCaida (posición de caída predicha) sobre pelota en vuelo
            local target = (marcaCaida and marcaCaida.Transparency < 0.99 and marcaCaida)
                        or (pelotaPart and pelotaPart.Transparency < 0.99 and pelotaPart)
                        or pelotaWS

            if target then
                local char = LP.Character
                local hrp  = char and char:FindFirstChild("HumanoidRootPart")
                local hum  = char and char:FindFirstChildOfClass("Humanoid")
                if hrp then
                    local tPos = target:IsA("BasePart") and target.Position
                              or (target.PrimaryPart and target.PrimaryPart.Position)
                    if tPos then
                        local dist = (tPos - hrp.Position).Magnitude
                        if State.fieldTrack then
                            lbTiempo.Text       = string.format("🏃 %.1f studs", dist)
                            lbTiempo.TextColor3 = dist < 15 and C.yellow or C.muted
                        end
                        if State.autoField and hum and dist > 2.5 then
                            hum:MoveTo(tPos)
                        end
                    end
                end
            end
        end
    end
end)

print("[SMB] ✅ Cargado — HR AutoSwing · Perfect Pitch · Field Tracker")

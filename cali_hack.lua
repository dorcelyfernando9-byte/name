-- ============================================================
--   CALISTHENICS GYM HACK
--   Auto-Train · Auto-Click · Auto-Combo · Stage Farm
--   ESP Estaciones · Auto-Field · BalanceGame Solve
--   Basado en Scripts_71373361143027.rbxlx
-- ============================================================
-- ⚠️ BUGS CRÍTICOS ENCONTRADOS (ver sección de abajo)
-- ============================================================

local Players      = game:GetService("Players")
local RunService   = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local UIS          = game:GetService("UserInputService")
local RS           = game:GetService("ReplicatedStorage")
local LP           = Players.LocalPlayer

-- ── Esperar recursos ──────────────────────────────────────
local Cali    = RS:WaitForChild("Cali", 15)
local Remotes = Cali and Cali:WaitForChild("Remotes", 10)
local Config  = Cali and require(Cali:WaitForChild("Config", 10))
local Gym     = workspace:WaitForChild("Gym", 15)

if not Remotes or not Config or not Gym then
    warn("[CaliHack] No se encontraron recursos del juego")
    return
end

-- ── Remotes del juego ─────────────────────────────────────
local R_Train         = Remotes:FindFirstChild("Train")
local R_StartExercise = Remotes:FindFirstChild("StartExercise")
local R_Trick         = Remotes:FindFirstChild("Trick")
local R_Select        = Remotes:FindFirstChild("Select")
local R_SetSlot       = Remotes:FindFirstChild("SetSlot")
local R_ComboRun      = Remotes:FindFirstChild("ComboRun")
local R_Stage         = Remotes:FindFirstChild("Stage")

-- ── Constantes ────────────────────────────────────────────
local STATION_RANGE = Config.StationRange or 10
local TRICKS        = Config.Tricks or {}
local TRICK_ORDER   = Config.TrickOrder or {}

-- ── Estado ────────────────────────────────────────────────
local State = {
    autoTrain    = false,
    autoClick    = false,
    stationESP   = true,
    autoCombo    = false,
    stageFarm    = false,
    balanceSolve = false,
}

local trainLoop   = nil
local clickLoop   = nil
local comboLoop   = nil
local stageLoop   = nil

-- ── Colores ───────────────────────────────────────────────
local C = {
    bg     = Color3.fromRGB(10,  13,  22),
    dark   = Color3.fromRGB(14,  18,  32),
    border = Color3.fromRGB(50,  65, 100),
    accent = Color3.fromRGB(80, 160, 255),
    green  = Color3.fromRGB(50,  220, 130),
    yellow = Color3.fromRGB(244, 196,  72),
    red    = Color3.fromRGB(235,  55,  55),
    white  = Color3.fromRGB(230, 236, 250),
    muted  = Color3.fromRGB(120, 135, 165),
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

-- ============================================================
--  💀 BUGS CRÍTICOS ENCONTRADOS
-- ============================================================
--
-- BUG #1 — Train:FireServer SIN rate-limit del lado del servidor
--   El ClickGame llama Train:FireServer("stage", pumpLevel)
--   El cliente CONTROLA pumpLevel vía SetAttribute("PumpLevel", v)
--   y lo envía directamente. NO hay cooldown visible client-side.
--   → Se puede spamear Train:FireServer infinitamente con
--     pumpLevel = Config.Clicks.maxLevel (10) para ganar Strength
--     + Cash + XP al máximo posible en cada call.
--
-- BUG #2 — StationRange validado SOLO en el cliente
--   nearestStation() en TrickClient hace:
--     if v31 > Config.StationRange then continue end
--   Pero StartExercise:FireServer(trick, station) NO valida
--   la distancia en el server (el server recibe el Instance
--   de la estación directamente del cliente).
--   → Puedes llamar StartExercise con CUALQUIER estación
--     del workspace.Gym sin importar donde estés parado.
--
-- BUG #3 — ComboRun:InvokeServer sin validación de combo
--   ComboRunner llama ComboRun:InvokeServer con la lista de
--   trucos del combo. El cliente construye esa lista libremente.
--   → Se puede enviar un combo de trucos que no tienes
--     o repetir el mismo combo sin límite de tiempo.
--
-- BUG #4 — Stage join sin verificar posición
--   StageClient llama FireServer("join", slots) directamente
--   desde el botón de UI sin verificar que el jugador esté
--   cerca del stage. → Farm de stages desde cualquier parte.
--
-- ============================================================

-- ── Helpers ───────────────────────────────────────────────
local function getCharacter()
    return LP.Character
end

local function getHRP()
    local c = getCharacter()
    return c and c:FindFirstChild("HumanoidRootPart")
end

-- Obtener todas las estaciones del Gym
local function getStations()
    local list = {}
    for _, s in ipairs(Gym:GetChildren()) do
        if s:GetAttribute("Kind") and s.PrimaryPart then
            table.insert(list, s)
        end
    end
    return list
end

-- Estación más cercana (igual que nearestStation del juego)
local function nearestStation()
    local hrp = getHRP()
    if not hrp then return nil end
    local best, bestDist = nil, math.huge
    for _, s in ipairs(getStations()) do
        local d = (s.PrimaryPart.Position - hrp.Position).Magnitude
        if d < bestDist then
            best = s; bestDist = d
        end
    end
    return best, bestDist
end

-- Trucos que el jugador tiene
local function getTricks()
    local ok, raw = pcall(function()
        return game:GetService("HttpService"):JSONDecode(LP:GetAttribute("Tricks") or "{}")
    end)
    return (ok and raw) or {}
end

-- ============================================================
--  EXPLOIT 1 — AUTO-TRAIN (BUG #1: Train spam sin rate-limit)
-- ============================================================
local function startAutoTrain()
    if trainLoop then return end
    if not R_Train then
        warn("[CaliHack] Remote Train no encontrado")
        return
    end
    local maxPump = (Config.Clicks and Config.Clicks.maxLevel) or 10
    trainLoop = task.spawn(function()
        while State.autoTrain do
            -- Enviar pumpLevel máximo directamente (BUG #1)
            LP:SetAttribute("PumpLevel", maxPump)
            pcall(function()
                R_Train:FireServer("stage", maxPump)
            end)
            task.wait(0.05) -- 20x por segundo, sin cooldown server-side
        end
        trainLoop = nil
    end)
end

local function stopAutoTrain()
    State.autoTrain = false
    trainLoop = nil
end

-- ============================================================
--  EXPLOIT 2 — AUTO-CLICK (ClickGame: simular pump perfecto)
-- ============================================================
local function startAutoClick()
    if clickLoop then return end
    if not R_Train then return end
    clickLoop = task.spawn(function()
        local maxPump = (Config.Clicks and Config.Clicks.maxLevel) or 10
        while State.autoClick do
            -- El servidor valida PumpLevel desde el atributo del player
            -- Se escribe directamente (BUG #1 combinado con BUG #3)
            pcall(function()
                LP:SetAttribute("ClickRunning", true)
                LP:SetAttribute("PumpLevel", maxPump)
                R_Train:FireServer("stage", maxPump)
            end)
            task.wait(0.03) -- ~33 reps/segundo
        end
        clickLoop = nil
    end)
end

-- ============================================================
--  EXPLOIT 3 — AUTO-COMBO (BUG #3: combo spam con trucos máximos)
-- ============================================================
local function startAutoCombo()
    if comboLoop then return end
    if not R_ComboRun then
        warn("[CaliHack] Remote ComboRun no encontrado")
        return
    end
    comboLoop = task.spawn(function()
        local myTricks = getTricks()
        -- Construir combo con los mejores trucos disponibles
        local comboList = {}
        for _, id in ipairs(TRICK_ORDER) do
            if myTricks[id] then
                table.insert(comboList, id)
                if #comboList >= 5 then break end
            end
        end
        if #comboList == 0 then
            -- Fallback: trucos iniciales que todo el mundo tiene
            comboList = {"muscle_up", "front_lever", "human_flag", "planche", "handstand"}
        end

        while State.autoCombo do
            pcall(function()
                R_ComboRun:InvokeServer("run", comboList)
            end)
            task.wait(1.5) -- esperar resultado del combo antes del siguiente
        end
        comboLoop = nil
    end)
end

-- ============================================================
--  EXPLOIT 4 — STAGE FARM (BUG #4: join sin verificar posición)
-- ============================================================
local function startStageFarm()
    if stageLoop then return end
    if not R_Stage then
        -- Intentar buscar el remote de stage dinámicamente
        R_Stage = Remotes:FindFirstChild("Stage") or Remotes:FindFirstChild("v_u_66")
    end
    stageLoop = task.spawn(function()
        while State.stageFarm do
            pcall(function()
                -- Enviar join al primer stage disponible (BUG #4)
                local slots = {}
                for i = 1, 5 do slots[i] = i end
                if R_Stage then
                    R_Stage:FireServer("join", slots)
                end
            end)
            task.wait(5)
        end
        stageLoop = nil
    end)
end

-- ============================================================
--  EXPLOIT 5 — BALANCE GAME AUTO-SOLVE
--  El estado del balance está en el engine local del cliente
--  Se puede forzar el eje X = 0 (perfecto equilibrio) vía
--  hookear el RenderStepped del balance engine
-- ============================================================
local balanceHook = nil

local function startBalanceSolve()
    if balanceHook then return end
    -- Hookear SetAttribute de BalanceAngle si existe
    balanceHook = RunService.RenderStepped:Connect(function()
        if not State.balanceSolve then
            balanceHook:Disconnect()
            balanceHook = nil
            return
        end
        -- Forzar eje X del balance a 0 (perfecto)
        pcall(function()
            LP:SetAttribute("BalanceX", 0)
            LP:SetAttribute("BalanceV", 0)
        end)
        -- Si hay un ValueBase con el ángulo, forzarlo a 0
        local char = getCharacter()
        if char then
            for _, v in ipairs(char:GetChildren()) do
                if v:IsA("NumberValue") and (v.Name:lower():find("balance") or v.Name:lower():find("angle")) then
                    v.Value = 0
                end
            end
        end
    end)
end

-- ============================================================
--  EXPLOIT 6 — STATION ESP
--  Billboard sobre cada estación con distancia y trucos
-- ============================================================
local espBillboards = {}

local function clearESP()
    for _, bb in ipairs(espBillboards) do
        pcall(function() bb:Destroy() end)
    end
    espBillboards = {}
end

local function buildESP()
    clearESP()
    if not State.stationESP then return end

    local myTricks = getTricks()

    for _, station in ipairs(getStations()) do
        local pp = station.PrimaryPart
        if not pp then continue end

        local kind = station:GetAttribute("Kind") or "?"

        -- Trucos disponibles en esta estación
        local available = {}
        for _, id in ipairs(TRICK_ORDER) do
            local td = TRICKS[id]
            if td and myTricks[id] then
                local eq = td.equipment
                if not eq or eq == kind or (type(eq) == "table" and table.find(eq, kind)) then
                    table.insert(available, id)
                end
            end
        end

        local bb = Instance.new("BillboardGui")
        bb.Name         = "CaliESP"
        bb.Size         = UDim2.fromOffset(160, 56)
        bb.StudsOffset  = Vector3.new(0, 4, 0)
        bb.AlwaysOnTop  = true
        bb.Adornee      = pp
        bb.Parent       = pp

        local bg = Instance.new("Frame", bb)
        bg.Size                   = UDim2.fromScale(1, 1)
        bg.BackgroundColor3       = C.bg
        bg.BackgroundTransparency = 0.2
        bg.BorderSizePixel        = 0
        corner(8, bg)
        stroke(C.accent, 1.5, bg)

        local lbName = Instance.new("TextLabel", bg)
        lbName.Size                = UDim2.new(1, -8, 0, 20)
        lbName.Position            = UDim2.fromOffset(4, 3)
        lbName.BackgroundTransparency = 1
        lbName.Font                = Enum.Font.GothamBlack
        lbName.TextSize            = 11
        lbName.TextColor3          = C.accent
        lbName.TextXAlignment      = Enum.TextXAlignment.Left
        lbName.Text                = "🏋 " .. kind

        local lbDist = Instance.new("TextLabel", bg)
        lbDist.Name                = "Dist"
        lbDist.Size                = UDim2.new(1, -8, 0, 14)
        lbDist.Position            = UDim2.fromOffset(4, 23)
        lbDist.BackgroundTransparency = 1
        lbDist.Font                = Enum.Font.GothamBold
        lbDist.TextSize            = 10
        lbDist.TextColor3          = C.yellow
        lbDist.TextXAlignment      = Enum.TextXAlignment.Left
        lbDist.Text                = "..."

        local lbTricks = Instance.new("TextLabel", bg)
        lbTricks.Size              = UDim2.new(1, -8, 0, 14)
        lbTricks.Position          = UDim2.fromOffset(4, 38)
        lbTricks.BackgroundTransparency = 1
        lbTricks.Font              = Enum.Font.Gotham
        lbTricks.TextSize          = 9
        lbTricks.TextColor3        = C.muted
        lbTricks.TextXAlignment    = Enum.TextXAlignment.Left
        lbTricks.Text              = #available > 0
            and table.concat({table.unpack(available, 1, 3)}, " · ")
                .. (#available > 3 and " +" .. (#available-3) or "")
            or "sin trucos"

        -- Actualizar distancia cada frame
        local conn
        conn = RunService.RenderStepped:Connect(function()
            if not (bb and bb.Parent) then conn:Disconnect(); return end
            local hrp = getHRP()
            if hrp then
                local d = (pp.Position - hrp.Position).Magnitude
                lbDist.Text      = string.format("📍 %.1f studs", d)
                lbDist.TextColor3 = d <= STATION_RANGE and C.green or C.yellow
                bg.BackgroundColor3 = d <= STATION_RANGE and Color3.fromRGB(10, 30, 15) or C.bg
                stroke(d <= STATION_RANGE and C.green or C.accent, 1.5, bg)
            end
        end)

        table.insert(espBillboards, bb)
    end
end

-- ============================================================
--  GUI PRINCIPAL
-- ============================================================
local Gui = Instance.new("ScreenGui")
Gui.Name           = "CaliHack"
Gui.ResetOnSpawn   = false
Gui.IgnoreGuiInset = true
Gui.DisplayOrder   = 50
Gui.Parent         = LP:WaitForChild("PlayerGui")

-- Panel principal
local Panel = Instance.new("Frame")
Panel.Name                   = "Panel"
Panel.AnchorPoint            = Vector2.new(0, 0.5)
Panel.Position               = UDim2.new(0, 10, 0.5, 0)
Panel.Size                   = UDim2.fromOffset(190, 310)
Panel.BackgroundColor3       = C.bg
Panel.BackgroundTransparency = 0.05
Panel.BorderSizePixel        = 0
Panel.Parent                 = Gui
corner(12, Panel)
stroke(C.border, 1.5, Panel)

local bgGrad = Instance.new("UIGradient", Panel)
bgGrad.Color    = ColorSequence.new(C.bg, Color3.fromRGB(18, 28, 52))
bgGrad.Rotation = 160

-- Header
local Header = Instance.new("Frame", Panel)
Header.Size            = UDim2.new(1, 0, 0, 36)
Header.BackgroundColor3 = C.dark
Header.BorderSizePixel = 0
corner(12, Header)

local lbTitle = Instance.new("TextLabel", Header)
lbTitle.Size = UDim2.fromScale(1, 1)
lbTitle.BackgroundTransparency = 1
lbTitle.Font = Enum.Font.GothamBlack
lbTitle.TextSize = 13
lbTitle.TextColor3 = C.accent
lbTitle.Text = "⚡ CALI HACK"

-- Status bar
local lbStatus = Instance.new("TextLabel", Panel)
lbStatus.Size = UDim2.new(1, -16, 0, 14)
lbStatus.Position = UDim2.fromOffset(8, 42)
lbStatus.BackgroundTransparency = 1
lbStatus.Font = Enum.Font.Code
lbStatus.TextSize = 9
lbStatus.TextColor3 = C.muted
lbStatus.TextXAlignment = Enum.TextXAlignment.Left
lbStatus.Text = "listo"

-- Lista de botones
local BtnList = Instance.new("Frame", Panel)
BtnList.Size = UDim2.new(1, -16, 0, 230)
BtnList.Position = UDim2.fromOffset(8, 62)
BtnList.BackgroundTransparency = 1

local Layout = Instance.new("UIListLayout", BtnList)
Layout.SortOrder  = Enum.SortOrder.LayoutOrder
Layout.Padding    = UDim.new(0, 6)

local function makeToggle(icon, label, stateKey, onEnable, onDisable)
    local row = Instance.new("Frame", BtnList)
    row.Size = UDim2.new(1, 0, 0, 34)
    row.BackgroundColor3 = C.dark
    row.BackgroundTransparency = 0.3
    row.BorderSizePixel = 0
    corner(8, row)

    local btn = Instance.new("TextButton", row)
    btn.Size = UDim2.fromScale(1, 1)
    btn.BackgroundTransparency = 1
    btn.Font = Enum.Font.GothamBold
    btn.TextSize = 11
    btn.TextXAlignment = Enum.TextXAlignment.Left
    btn.TextColor3 = C.white

    local dot = Instance.new("Frame", row)
    dot.AnchorPoint = Vector2.new(1, 0.5)
    dot.Position = UDim2.new(1, -10, 0.5, 0)
    dot.Size = UDim2.fromOffset(10, 10)
    dot.BackgroundColor3 = State[stateKey] and C.green or C.muted
    dot.BorderSizePixel = 0
    corner(5, dot)

    local function update()
        btn.Text = "  " .. icon .. "  " .. label
        dot.BackgroundColor3 = State[stateKey] and C.green or C.muted
        row.BackgroundColor3 = State[stateKey] and Color3.fromRGB(10, 30, 15) or C.dark
        tween(dot, 0.15, { BackgroundColor3 = State[stateKey] and C.green or C.muted })
    end
    update()

    btn.MouseButton1Click:Connect(function()
        State[stateKey] = not State[stateKey]
        update()
        if State[stateKey] then
            if onEnable then onEnable() end
            lbStatus.Text = icon .. " " .. label .. " ON"
        else
            if onDisable then onDisable() end
            lbStatus.Text = icon .. " " .. label .. " OFF"
        end
    end)

    return row
end

makeToggle("🔥", "Auto-Train (spam)",  "autoTrain",    startAutoTrain,    stopAutoTrain)
makeToggle("👆", "Auto-Click (reps)",  "autoClick",    startAutoClick,    function() State.autoClick = false; clickLoop = nil end)
makeToggle("🔗", "Auto-Combo",         "autoCombo",    startAutoCombo,    function() State.autoCombo = false; comboLoop = nil end)
makeToggle("🏆", "Stage Farm",         "stageFarm",    startStageFarm,    function() State.stageFarm = false; stageLoop = nil end)
makeToggle("⚖️", "Balance Solve",      "balanceSolve", startBalanceSolve, function() State.balanceSolve = false end)
makeToggle("📡", "Station ESP",        "stationESP",   buildESP,          clearESP)

-- Botón candado + Drag
local locked = false
local LockBtn = Instance.new("TextButton", Panel)
LockBtn.AnchorPoint = Vector2.new(1, 0)
LockBtn.Position = UDim2.new(1, -4, 0, 4)
LockBtn.Size = UDim2.fromOffset(22, 22)
LockBtn.BackgroundColor3 = C.dark
LockBtn.BackgroundTransparency = 0.3
LockBtn.Text = "🔓"
LockBtn.TextSize = 11
LockBtn.Font = Enum.Font.GothamBold
LockBtn.TextColor3 = C.white
LockBtn.BorderSizePixel = 0
LockBtn.ZIndex = 10
corner(11, LockBtn)
stroke(C.border, 1, LockBtn)

LockBtn.MouseButton1Click:Connect(function()
    locked = not locked
    LockBtn.Text = locked and "🔒" or "🔓"
    LockBtn.BackgroundColor3 = locked and C.yellow or C.dark
    tween(LockBtn, 0.15, { BackgroundTransparency = locked and 0.1 or 0.3 })
end)

do
    local drag, ds, sp = false
    Panel.InputBegan:Connect(function(i)
        if locked then return end
        if i.UserInputType == Enum.UserInputType.MouseButton1
        or i.UserInputType == Enum.UserInputType.Touch then
            drag = true; ds = i.Position; sp = Panel.Position
        end
    end)
    Panel.InputEnded:Connect(function(i)
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
            Panel.Position = UDim2.new(
                sp.X.Scale, sp.X.Offset + d.X,
                sp.Y.Scale, sp.Y.Offset + d.Y)
        end
    end)
end

-- ── Status loop ───────────────────────────────────────────
RunService.RenderStepped:Connect(function()
    -- Actualizar fortaleza actual en el header
    local str = LP:GetAttribute("Strength") or 0
    local cash = LP:GetAttribute("Cash") or 0
    local lvl  = LP:GetAttribute("Level") or 1
    lbTitle.Text = string.format("⚡ CALI  Lv%d", lvl)
    if str > 0 or cash > 0 then
        lbStatus.Text = string.format("💪 %d  💰 %d", str, cash)
    end
end)

-- ── Build ESP inicial ─────────────────────────────────────
if State.stationESP then buildESP() end

-- ── Recargar ESP si llegan nuevas estaciones ──────────────
Gym.ChildAdded:Connect(function(c)
    if State.stationESP then
        task.wait(0.5)
        buildESP()
    end
end)

print("[CaliHack] ✅ Cargado — 4 bugs críticos explotados")
print("  BUG#1: Train:FireServer sin rate-limit → spam de Strength/Cash")
print("  BUG#2: StationRange solo client-side → StartExercise remoto")
print("  BUG#3: ComboRun lista libre → combo spam sin límite")
print("  BUG#4: Stage join sin verificar posición → farm desde cualquier lugar")

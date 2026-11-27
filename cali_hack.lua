-- ============================================================
--   CALISTHENICS GYM HACK  v2
--   Auto-Entrenar · Auto-Click · Auto-Combo · Stage Farm
--   Auto-Renacimiento · ESP Estaciones · Balance Solve
--   Basado en Scripts_71373361143027.rbxlx
-- ============================================================
-- 💀 BUGS CRÍTICOS EXPLOTADOS:
--   BUG#1  — Stage:FireServer("press") sin validación de timing real
--   BUG#2  — StartExercise sin verificación de distancia server-side
--   BUG#3  — ComboRun:InvokeServer sin validar ownership de trucos
--   BUG#4  — Stage:FireServer("join") sin verificación de posición
--   BUG#5  — Rebirth:InvokeServer() sin cooldown visible
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
local Gym     = workspace:WaitForChild("Gym", 15)

if not Remotes or not Gym then
    warn("[CaliHack] No se encontraron recursos del juego")
    return
end

-- ── Remotes del juego (verificados desde el dump) ─────────
--   StartExercise  = RemoteEvent  → inicia ejercicio en station
--   Stage          = RemoteEvent  → bidireccional del ClickGame (press/join/etc)
--   ComboRun       = RemoteFunction → invocar combo de trucos
--   Rebirth        = RemoteFunction → renacimiento
--   Train          = RemoteEvent  → solo recibir stats (server→cliente)
local R_StartExercise = Remotes:WaitForChild("StartExercise", 10)
local R_Stage         = Remotes:WaitForChild("Stage", 10)
local R_ComboRun      = Remotes:WaitForChild("ComboRun", 10)
local R_Rebirth       = Remotes:WaitForChild("Rebirth", 10)
local R_Train         = Remotes:WaitForChild("Train", 10)  -- solo escucha

-- ── Estado global ──────────────────────────────────────────
local State = {
    autoTrain    = false,
    autoClick    = false,
    stationESP   = true,
    autoCombo    = false,
    stageFarm    = false,
    balanceSolve = false,
    autoRebirth  = false,
}

local trainLoop   = nil
local clickLoop   = nil
local comboLoop   = nil
local stageLoop   = nil
local rebirthLoop = nil

-- ── Paleta ─────────────────────────────────────────────────
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

-- ── Helpers ────────────────────────────────────────────────
local function getCharacter()
    return LP.Character
end
local function getHRP()
    local c = getCharacter()
    return c and c:FindFirstChild("HumanoidRootPart")
end

-- Leer atributo numérico del LP con fallback
local function getStat(name)
    return tonumber(LP:GetAttribute(name)) or 0
end

-- Estación más cercana del Gym
local function nearestStation()
    local hrp = getHRP()
    if not hrp then return nil end
    local best, bestDist = nil, math.huge
    for _, s in ipairs(Gym:GetChildren()) do
        if s:GetAttribute("Kind") and s.PrimaryPart then
            local d = (s.PrimaryPart.Position - hrp.Position).Magnitude
            if d < bestDist then best = s; bestDist = d end
        end
    end
    return best, bestDist
end

-- Obtener ID de un ejercicio de la estación
-- El juego usa v187.exercise que viene del Kind de la estación
local function getExerciseId(station)
    -- El Kind del station (ej: "HighBar", "Parallettes", "Pole")
    -- StartExercise recibe (exerciseId, stationInstance)
    -- exerciseId es el primer ejercicio disponible del Kind
    local kind = station:GetAttribute("Kind")
    -- Intentar leer ejercicios desde el atributo de la estación
    -- En el juego lo hace holdExercise() que busca el primero no bloqueado
    -- Fallback: usar el Kind como id del ejercicio base
    return kind
end

-- ============================================================
--  EXPLOIT 1 — AUTO-ENTRENAR (flujo correcto con Stage remote)
--  El flujo real del juego:
--    1. StartExercise:FireServer(ejercicio, stationInstance)
--    2. Server devuelve via Stage.OnClientEvent los datos del meter
--    3. Cliente responde Stage:FireServer("press", i, timing, msgAt)
--  BUG#1: timing=0 siempre da "perfect press" sin validación real
-- ============================================================

-- Variables del meter (llenadas por el listener del server)
local meterActive = false
local meterData   = nil

-- Listener del Stage remote (server→cliente con datos del meter)
-- El server manda: "meter", index, meterConfig, messageTime
local stageConn = nil
local function setupStageListener()
    if stageConn then stageConn:Disconnect() end
    stageConn = R_Stage.OnClientEvent:Connect(function(action, ...)
        if action == "meter" then
            local args = {...}
            -- args[1] = index del rep, args[2] = meter config, args[3] = msgAt
            meterData = {
                i        = args[1] or 1,
                meter    = args[2],
                msgAt    = args[3] or os.clock(),
                meterStart = os.clock(),
                pressed  = false,
            }
            meterActive = true
        elseif action == "done" or action == "fail" or action == "end" then
            meterActive = false
            meterData   = nil
        end
    end)
end
setupStageListener()

-- Auto-responder al meter inmediatamente (timing=0 = press perfecto al inicio)
local function autoPressIfMeter()
    if meterActive and meterData and not meterData.pressed then
        meterData.pressed = true
        meterActive = false
        local t = os.clock()
        pcall(function()
            -- BUG#1: press inmediato con timing=0.05 (dentro de la ventana perfecta)
            R_Stage:FireServer("press", meterData.i, 0.05, t - (meterData.msgAt or t))
        end)
        meterData = nil
    end
end

-- Hilo que inicia ejercicios continuamente
local function startAutoTrain()
    if trainLoop then return end
    if not R_StartExercise or not R_Stage then
        warn("[CaliHack] Remotes StartExercise/Stage no encontrados")
        return
    end
    trainLoop = task.spawn(function()
        while State.autoTrain do
            local station, dist = nearestStation()
            if station then
                local exerciseId = getExerciseId(station)
                if exerciseId then
                    -- BUG#2: no importa la distancia, el server no valida
                    pcall(function()
                        R_StartExercise:FireServer(exerciseId, station)
                    end)
                    -- Esperar que llegue el meter event y responder
                    local deadline = os.clock() + 3
                    while os.clock() < deadline and State.autoTrain do
                        autoPressIfMeter()
                        task.wait(0.05)
                    end
                    -- Esperar cooldown mínimo entre ejercicios
                    task.wait(0.3)
                else
                    task.wait(1)
                end
            else
                task.wait(1)
            end
        end
        trainLoop = nil
    end)
end

local function stopAutoTrain()
    State.autoTrain = false
    trainLoop = nil
end

-- ============================================================
--  EXPLOIT 2 — AUTO-CLICK (spam de press al meter del Stage)
--  Mismo flujo que Auto-Train pero forzando presses más rápido
-- ============================================================
local function startAutoClick()
    if clickLoop then return end
    if not R_StartExercise or not R_Stage then return end
    clickLoop = task.spawn(function()
        while State.autoClick do
            -- Spamear presses si hay meter activo
            autoPressIfMeter()
            -- Forzar inicio de ejercicio en la estación más cercana
            local station = nearestStation()
            if station then
                local exerciseId = getExerciseId(station)
                if exerciseId and not meterActive then
                    pcall(function()
                        R_StartExercise:FireServer(exerciseId, station)
                    end)
                end
            end
            task.wait(0.08)  -- ~12 reps/seg con press perfecto en cada una
        end
        clickLoop = nil
    end)
end

-- ============================================================
--  EXPLOIT 3 — AUTO-COMBO (BUG#3: combo sin validar ownership)
-- ============================================================
local function startAutoCombo()
    if comboLoop then return end
    if not R_ComboRun then
        warn("[CaliHack] Remote ComboRun no encontrado")
        return
    end
    comboLoop = task.spawn(function()
        -- Construir combo con los kinds de estaciones disponibles
        local comboList = {}
        for _, s in ipairs(Gym:GetChildren()) do
            local kind = s:GetAttribute("Kind")
            if kind then
                table.insert(comboList, kind)
            end
        end
        if #comboList == 0 then
            comboList = {"HighBar", "Parallettes", "Pole"}
        end
        while State.autoCombo do
            pcall(function()
                -- BUG#3: el server no valida que tengamos los trucos
                R_ComboRun:InvokeServer("run", comboList)
            end)
            task.wait(2)
        end
        comboLoop = nil
    end)
end

-- ============================================================
--  EXPLOIT 4 — STAGE FARM (BUG#4: join sin check de posición)
-- ============================================================
local function startStageFarm()
    if stageLoop then return end
    if not R_Stage then return end
    stageLoop = task.spawn(function()
        while State.stageFarm do
            local slots = {}
            -- Pasar todas las estaciones como slots (cualquier posición)
            for _, s in ipairs(Gym:GetChildren()) do
                if s:GetAttribute("Kind") then
                    table.insert(slots, s)
                end
            end
            if #slots > 0 then
                pcall(function()
                    -- BUG#4: sin verificación de posición server-side
                    R_Stage:FireServer("join", slots)
                end)
            end
            task.wait(1.5)
        end
        stageLoop = nil
    end)
end

-- ============================================================
--  EXPLOIT 5 — AUTO-RENACIMIENTO
--  Rebirth:InvokeServer() — RemoteFunction sin cooldown visible
--  El juego pide confirmación doble en UI pero el remote
--  se puede llamar directamente sin el doble-click
--  Condición: se activa cuando Strength >= umbral configurable
-- ============================================================
local REBIRTH_THRESHOLD = 1000  -- Puedes editar este valor en el panel

local function startAutoRebirth()
    if rebirthLoop then return end
    if not R_Rebirth then
        warn("[CaliHack] Remote Rebirth no encontrado")
        return
    end
    rebirthLoop = task.spawn(function()
        while State.autoRebirth do
            local strength = getStat("Strength")
            if strength >= REBIRTH_THRESHOLD then
                local ok, result = pcall(function()
                    return R_Rebirth:InvokeServer()
                end)
                if ok and result then
                    -- Renacimiento exitoso — esperar que el server procese
                    task.wait(3)
                elseif ok and not result then
                    -- El server rechazó (busy, loading, etc.)
                    task.wait(5)
                else
                    -- Error de red — esperar un poco
                    task.wait(2)
                end
            else
                task.wait(1)
            end
        end
        rebirthLoop = nil
    end)
end

local function stopAutoRebirth()
    State.autoRebirth = false
    rebirthLoop = nil
end

-- ============================================================
--  BALANCE SOLVE — Forzar BalanceX = 0 cada frame
-- ============================================================
local balanceConn = nil
local function startBalanceSolve()
    if balanceConn then balanceConn:Disconnect() end
    balanceConn = RunService.Heartbeat:Connect(function()
        if State.balanceSolve then
            pcall(function()
                LP:SetAttribute("BalanceX", 0)
                LP:SetAttribute("BalanceY", 0)
            end)
        end
    end)
end

-- ============================================================
--  ESP ESTACIONES
-- ============================================================
local espBillboards = {}
local function clearESP()
    for _, b in pairs(espBillboards) do
        pcall(function() b:Destroy() end)
    end
    espBillboards = {}
end

local function buildESP()
    clearESP()
    for _, station in ipairs(Gym:GetChildren()) do
        local kind = station:GetAttribute("Kind")
        if kind and station.PrimaryPart then
            local bb = Instance.new("BillboardGui")
            bb.Name       = "CaliESP"
            bb.AlwaysOnTop = true
            bb.Size        = UDim2.new(0, 180, 0, 50)
            bb.StudsOffset = Vector3.new(0, 4, 0)
            bb.Adornee     = station.PrimaryPart
            bb.Parent      = game:GetService("CoreGui")

            local lbl = Instance.new("TextLabel", bb)
            lbl.Size            = UDim2.new(1, 0, 1, 0)
            lbl.BackgroundColor3 = Color3.fromRGB(10, 13, 22)
            lbl.BackgroundTransparency = 0.3
            lbl.TextColor3      = C.green
            lbl.Font            = Enum.Font.GothamBold
            lbl.TextScaled      = true
            lbl.Text            = "🏋️ " .. kind
            corner(6, lbl)

            -- Actualizar distancia cada segundo
            task.spawn(function()
                while State.stationESP and bb.Parent do
                    local hrp = getHRP()
                    if hrp and station.PrimaryPart then
                        local d = math.floor((station.PrimaryPart.Position - hrp.Position).Magnitude)
                        lbl.Text = "🏋️ " .. kind .. "\n📏 " .. d .. " studs"
                    end
                    task.wait(0.5)
                end
            end)
            table.insert(espBillboards, bb)
        end
    end
end

-- ============================================================
--  UI
-- ============================================================
-- Destruir instancias anteriores
pcall(function()
    game:GetService("CoreGui"):FindFirstChild("CaliHackGUI"):Destroy()
end)

local gui = Instance.new("ScreenGui")
gui.Name           = "CaliHackGUI"
gui.ResetOnSpawn   = false
gui.IgnoreGuiInset = true
gui.Parent         = game:GetService("CoreGui")

-- Panel principal
local panel = Instance.new("Frame", gui)
panel.Name              = "Panel"
panel.Size              = UDim2.new(0, 240, 0, 420)
panel.Position          = UDim2.new(0, 20, 0.5, -210)
panel.BackgroundColor3  = C.bg
panel.BorderSizePixel   = 0
corner(12, panel)
stroke(C.border, 1.5, panel)

-- Sombra exterior
local shadow = Instance.new("ImageLabel", panel)
shadow.Name               = "Shadow"
shadow.AnchorPoint        = Vector2.new(0.5, 0.5)
shadow.BackgroundTransparency = 1
shadow.Position           = UDim2.new(0.5, 0, 0.5, 4)
shadow.Size               = UDim2.new(1, 30, 1, 30)
shadow.ZIndex             = 0
shadow.Image              = "rbxassetid://6014261993"
shadow.ImageColor3        = Color3.new(0, 0, 0)
shadow.ImageTransparency  = 0.55
shadow.ScaleType          = Enum.ScaleType.Slice
shadow.SliceCenter        = Rect.new(49, 49, 450, 450)

-- Header
local header = Instance.new("Frame", panel)
header.Size             = UDim2.new(1, 0, 0, 44)
header.BackgroundColor3 = C.dark
header.BorderSizePixel  = 0
corner(12, header)

local title = Instance.new("TextLabel", header)
title.Size              = UDim2.new(1, -44, 1, 0)
title.Position          = UDim2.new(0, 12, 0, 0)
title.BackgroundTransparency = 1
title.Text              = "🏋️  CaliHack  v2"
title.Font              = Enum.Font.GothamBlack
title.TextSize          = 15
title.TextColor3        = C.white
title.TextXAlignment    = Enum.TextXAlignment.Left

-- Stat bar (Strength / Cash)
local statBar = Instance.new("TextLabel", panel)
statBar.Size              = UDim2.new(1, -16, 0, 22)
statBar.Position          = UDim2.new(0, 8, 0, 48)
statBar.BackgroundTransparency = 1
statBar.Font              = Enum.Font.Gotham
statBar.TextSize          = 11
statBar.TextColor3        = C.muted
statBar.Text              = "Str: -- | Cash: -- | Rebirths: --"
statBar.TextXAlignment    = Enum.TextXAlignment.Left

RunService.Heartbeat:Connect(function()
    if statBar.Parent then
        statBar.Text = string.format("💪 %d  |  💵 %d  |  🔄 %d rebirths",
            getStat("Strength"),
            getStat("Cash"),
            getStat("Rebirths")
        )
    end
end)

-- Contenedor de botones con scroll
local scroll = Instance.new("ScrollingFrame", panel)
scroll.Size              = UDim2.new(1, -8, 1, -82)
scroll.Position          = UDim2.new(0, 4, 0, 76)
scroll.BackgroundTransparency = 1
scroll.ScrollBarThickness = 3
scroll.CanvasSize         = UDim2.new(0, 0, 0, 0)
scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y

local layout = Instance.new("UIListLayout", scroll)
layout.Padding        = UDim.new(0, 5)
layout.SortOrder      = Enum.SortOrder.LayoutOrder
layout.FillDirection  = Enum.FillDirection.Vertical

local pad = Instance.new("UIPadding", scroll)
pad.PaddingTop   = UDim.new(0, 2)
pad.PaddingBottom = UDim.new(0, 6)

-- Umbral de Rebirth editable
local threshFrame = Instance.new("Frame", scroll)
threshFrame.Size             = UDim2.new(1, -8, 0, 32)
threshFrame.BackgroundColor3 = C.dark
threshFrame.BorderSizePixel  = 0
threshFrame.LayoutOrder      = 0
corner(8, threshFrame)
stroke(C.border, 1, threshFrame)

local threshLabel = Instance.new("TextLabel", threshFrame)
threshLabel.Size              = UDim2.new(0, 100, 1, 0)
threshLabel.BackgroundTransparency = 1
threshLabel.Text              = "🔄 Umbral Str:"
threshLabel.Font              = Enum.Font.Gotham
threshLabel.TextSize          = 11
threshLabel.TextColor3        = C.muted
threshLabel.TextXAlignment    = Enum.TextXAlignment.Left
threshLabel.Position          = UDim2.new(0, 8, 0, 0)

local threshBox = Instance.new("TextBox", threshFrame)
threshBox.Size              = UDim2.new(0, 80, 0, 22)
threshBox.Position          = UDim2.new(1, -88, 0.5, -11)
threshBox.BackgroundColor3  = C.bg
threshBox.TextColor3        = C.yellow
threshBox.Font              = Enum.Font.GothamBold
threshBox.TextSize          = 12
threshBox.Text              = tostring(REBIRTH_THRESHOLD)
threshBox.ClearTextOnFocus  = false
corner(6, threshBox)
stroke(C.border, 1, threshBox)
threshBox.FocusLost:Connect(function()
    local v = tonumber(threshBox.Text)
    if v and v > 0 then
        REBIRTH_THRESHOLD = v
    else
        threshBox.Text = tostring(REBIRTH_THRESHOLD)
    end
end)

-- Función makeToggle
local toggleOrder = 1
local function makeToggle(icon, label, stateKey, onFn, offFn)
    local row = Instance.new("Frame", scroll)
    row.Size             = UDim2.new(1, -8, 0, 38)
    row.BackgroundColor3 = C.dark
    row.BorderSizePixel  = 0
    row.LayoutOrder      = toggleOrder
    toggleOrder          = toggleOrder + 1
    corner(8, row)
    stroke(C.border, 1, row)

    local lbl = Instance.new("TextLabel", row)
    lbl.Size              = UDim2.new(1, -56, 1, 0)
    lbl.Position          = UDim2.new(0, 10, 0, 0)
    lbl.BackgroundTransparency = 1
    lbl.Text              = icon .. "  " .. label
    lbl.Font              = Enum.Font.GothamBold
    lbl.TextSize          = 12
    lbl.TextColor3        = C.white
    lbl.TextXAlignment    = Enum.TextXAlignment.Left

    -- Dot indicador
    local dot = Instance.new("Frame", row)
    dot.Size              = UDim2.new(0, 10, 0, 10)
    dot.AnchorPoint       = Vector2.new(0.5, 0.5)
    dot.Position          = UDim2.new(1, -32, 0.5, 0)
    dot.BackgroundColor3  = C.red
    dot.BorderSizePixel   = 0
    corner(99, dot)

    local btn = Instance.new("TextButton", row)
    btn.Size              = UDim2.new(0, 44, 0, 26)
    btn.AnchorPoint       = Vector2.new(1, 0.5)
    btn.Position          = UDim2.new(1, -8, 0.5, 0)
    btn.BackgroundColor3  = Color3.fromRGB(30, 36, 60)
    btn.TextColor3        = C.muted
    btn.Font              = Enum.Font.GothamBold
    btn.TextSize          = 11
    btn.Text              = "OFF"
    corner(6, btn)
    stroke(C.border, 1, btn)

    btn.MouseButton1Click:Connect(function()
        State[stateKey] = not State[stateKey]
        if State[stateKey] then
            tween(btn, 0.2, {BackgroundColor3 = Color3.fromRGB(30, 90, 50)})
            tween(dot, 0.2, {BackgroundColor3 = C.green})
            btn.Text       = "ON"
            btn.TextColor3 = C.green
            if onFn then task.spawn(onFn) end
        else
            tween(btn, 0.2, {BackgroundColor3 = Color3.fromRGB(30, 36, 60)})
            tween(dot, 0.2, {BackgroundColor3 = C.red})
            btn.Text       = "OFF"
            btn.TextColor3 = C.muted
            if offFn then offFn() end
        end
    end)

    return btn, dot
end

-- Toggles
makeToggle("🏋️",  "Auto-Entrenar",    "autoTrain",    startAutoTrain,    stopAutoTrain)
makeToggle("👆",  "Auto-Click (press)", "autoClick",   startAutoClick,    function() State.autoClick = false; clickLoop = nil end)
makeToggle("🔄",  "Auto-Renacimiento", "autoRebirth",  startAutoRebirth,  stopAutoRebirth)
makeToggle("🤸",  "Auto-Combo",        "autoCombo",    startAutoCombo,    function() State.autoCombo = false; comboLoop = nil end)
makeToggle("🗺️", "Stage Farm",         "stageFarm",    startStageFarm,    function() State.stageFarm = false; stageLoop = nil end)
makeToggle("⚖️",  "Balance Solve",      "balanceSolve", startBalanceSolve, nil)

-- Toggle ESP (especial)
do
    local row = Instance.new("Frame", scroll)
    row.Size             = UDim2.new(1, -8, 0, 38)
    row.BackgroundColor3 = C.dark
    row.BorderSizePixel  = 0
    row.LayoutOrder      = toggleOrder
    corner(8, row)
    stroke(C.border, 1, row)

    local lbl = Instance.new("TextLabel", row)
    lbl.Size              = UDim2.new(1, -56, 1, 0)
    lbl.Position          = UDim2.new(0, 10, 0, 0)
    lbl.BackgroundTransparency = 1
    lbl.Text              = "📡  Station ESP"
    lbl.Font              = Enum.Font.GothamBold
    lbl.TextSize          = 12
    lbl.TextColor3        = C.white
    lbl.TextXAlignment    = Enum.TextXAlignment.Left

    local dot = Instance.new("Frame", row)
    dot.Size              = UDim2.new(0, 10, 0, 10)
    dot.AnchorPoint       = Vector2.new(0.5, 0.5)
    dot.Position          = UDim2.new(1, -32, 0.5, 0)
    dot.BackgroundColor3  = C.green
    dot.BorderSizePixel   = 0
    corner(99, dot)

    local btn = Instance.new("TextButton", row)
    btn.Size              = UDim2.new(0, 44, 0, 26)
    btn.AnchorPoint       = Vector2.new(1, 0.5)
    btn.Position          = UDim2.new(1, -8, 0.5, 0)
    btn.BackgroundColor3  = Color3.fromRGB(30, 90, 50)
    btn.TextColor3        = C.green
    btn.Font              = Enum.Font.GothamBold
    btn.TextSize          = 11
    btn.Text              = "ON"
    corner(6, btn)
    stroke(C.border, 1, btn)

    State.stationESP = true
    buildESP()

    btn.MouseButton1Click:Connect(function()
        State.stationESP = not State.stationESP
        if State.stationESP then
            tween(btn, 0.2, {BackgroundColor3 = Color3.fromRGB(30, 90, 50)})
            tween(dot, 0.2, {BackgroundColor3 = C.green})
            btn.Text = "ON"; btn.TextColor3 = C.green
            buildESP()
        else
            tween(btn, 0.2, {BackgroundColor3 = Color3.fromRGB(30, 36, 60)})
            tween(dot, 0.2, {BackgroundColor3 = C.red})
            btn.Text = "OFF"; btn.TextColor3 = C.muted
            clearESP()
        end
    end)
end

-- Barra de estado
local statusBar = Instance.new("Frame", panel)
statusBar.Size             = UDim2.new(1, -16, 0, 20)
statusBar.Position         = UDim2.new(0, 8, 1, -26)
statusBar.BackgroundTransparency = 1

local statusLbl = Instance.new("TextLabel", statusBar)
statusLbl.Size             = UDim2.new(1, 0, 1, 0)
statusLbl.BackgroundTransparency = 1
statusLbl.Font             = Enum.Font.Gotham
statusLbl.TextSize         = 10
statusLbl.TextColor3       = C.muted
statusLbl.Text             = "✅ CaliHack v2 cargado"
statusLbl.TextXAlignment   = Enum.TextXAlignment.Center

task.delay(3, function()
    statusLbl.Text = "⚡ 5 bugs críticos explotados"
end)

-- ── Drag ──────────────────────────────────────────────────
do
    local dragging, dragStart, startPos
    header.InputBegan:Connect(function(inp)
        if inp.UserInputType == Enum.UserInputType.MouseButton1 then
            dragging  = true
            dragStart = inp.Position
            startPos  = panel.Position
        end
    end)
    UIS.InputChanged:Connect(function(inp)
        if dragging and inp.UserInputType == Enum.UserInputType.MouseMovement then
            local d = inp.Position - dragStart
            panel.Position = UDim2.new(
                startPos.X.Scale, startPos.X.Offset + d.X,
                startPos.Y.Scale, startPos.Y.Offset + d.Y
            )
        end
    end)
    UIS.InputEnded:Connect(function(inp)
        if inp.UserInputType == Enum.UserInputType.MouseButton1 then
            dragging = false
        end
    end)
end

-- ── Lock / Minimizar ─────────────────────────────────────
local locked   = false
local minimized = false
local normalH  = panel.Size.Y.Offset

local lockBtn = Instance.new("TextButton", header)
lockBtn.Size              = UDim2.new(0, 28, 0, 28)
lockBtn.AnchorPoint       = Vector2.new(1, 0.5)
lockBtn.Position          = UDim2.new(1, -8, 0.5, 0)
lockBtn.BackgroundColor3  = C.bg
lockBtn.Text              = "−"
lockBtn.TextColor3        = C.muted
lockBtn.Font              = Enum.Font.GothamBold
lockBtn.TextSize          = 14
corner(6, lockBtn)
stroke(C.border, 1, lockBtn)

lockBtn.MouseButton1Click:Connect(function()
    minimized = not minimized
    if minimized then
        tween(panel, 0.25, {Size = UDim2.new(0, 240, 0, 44)})
        lockBtn.Text = "+"
    else
        tween(panel, 0.25, {Size = UDim2.new(0, 240, 0, normalH)})
        lockBtn.Text = "−"
    end
end)

print("[CaliHack v2] ✅ Cargado correctamente")
print("  BUG#1: Stage:FireServer('press') con timing=0 → rep perfecta")
print("  BUG#2: StartExercise sin check de distancia → cualquier station")
print("  BUG#3: ComboRun sin validar ownership de trucos")
print("  BUG#4: Stage:FireServer('join') sin check de posición")
print("  BUG#5: Rebirth:InvokeServer() spam sin cooldown")
print("  Auto-Renacimiento activo con umbral:", REBIRTH_THRESHOLD)

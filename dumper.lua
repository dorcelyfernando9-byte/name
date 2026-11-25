-- =============================================
--         SUPERSTAR BASEBALL DUMPER
--         by dorcelyfernando9-byte
-- =============================================

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local LocalPlayer = Players.LocalPlayer

-- Detectar juego
local gameName = game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId).Name
local isCorrectGame = string.find(gameName:lower(), "baseball") ~= nil

-- =============================================
-- GUI
-- =============================================

local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "DumperGUI"
ScreenGui.ResetOnSpawn = false
ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
ScreenGui.Parent = LocalPlayer.PlayerGui

-- Frame principal
local MainFrame = Instance.new("Frame")
MainFrame.Size = UDim2.new(0, 400, 0, 220)
MainFrame.Position = UDim2.new(0.5, -200, 0.5, -110)
MainFrame.BackgroundColor3 = Color3.fromRGB(18, 18, 18)
MainFrame.BorderSizePixel = 0
MainFrame.Parent = ScreenGui

local UICorner = Instance.new("UICorner")
UICorner.CornerRadius = UDim.new(0, 10)
UICorner.Parent = MainFrame

-- Barra de titulo
local TitleBar = Instance.new("Frame")
TitleBar.Size = UDim2.new(1, 0, 0, 40)
TitleBar.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
TitleBar.BorderSizePixel = 0
TitleBar.Parent = MainFrame

local UICornerTitle = Instance.new("UICorner")
UICornerTitle.CornerRadius = UDim.new(0, 10)
UICornerTitle.Parent = TitleBar

-- Titulo
local Title = Instance.new("TextLabel")
Title.Size = UDim2.new(1, -10, 1, 0)
Title.Position = UDim2.new(0, 10, 0, 0)
Title.BackgroundTransparency = 1
Title.Text = "⚾ BASEBALL DUMPER"
Title.TextColor3 = Color3.fromRGB(255, 255, 255)
Title.TextSize = 16
Title.Font = Enum.Font.GothamBold
Title.TextXAlignment = Enum.TextXAlignment.Left
Title.Parent = TitleBar

-- Boton cerrar
local CloseBtn = Instance.new("TextButton")
CloseBtn.Size = UDim2.new(0, 30, 0, 30)
CloseBtn.Position = UDim2.new(1, -35, 0, 5)
CloseBtn.BackgroundColor3 = Color3.fromRGB(220, 50, 50)
CloseBtn.Text = "X"
CloseBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
CloseBtn.TextSize = 14
CloseBtn.Font = Enum.Font.GothamBold
CloseBtn.BorderSizePixel = 0
CloseBtn.Parent = TitleBar

local UICornerClose = Instance.new("UICorner")
UICornerClose.CornerRadius = UDim.new(0, 6)
UICornerClose.Parent = CloseBtn

-- Info del juego
local GameLabel = Instance.new("TextLabel")
GameLabel.Size = UDim2.new(1, -20, 0, 30)
GameLabel.Position = UDim2.new(0, 10, 0, 50)
GameLabel.BackgroundTransparency = 1
GameLabel.Text = "🎮 Juego: " .. gameName
GameLabel.TextColor3 = isCorrectGame and Color3.fromRGB(100, 220, 100) or Color3.fromRGB(220, 100, 100)
GameLabel.TextSize = 13
GameLabel.Font = Enum.Font.Gotham
GameLabel.TextXAlignment = Enum.TextXAlignment.Left
GameLabel.TextTruncate = Enum.TextTruncate.AtEnd
GameLabel.Parent = MainFrame

-- Status
local StatusLabel = Instance.new("TextLabel")
StatusLabel.Size = UDim2.new(1, -20, 0, 25)
StatusLabel.Position = UDim2.new(0, 10, 0, 85)
StatusLabel.BackgroundTransparency = 1
StatusLabel.Text = "Estado: Esperando..."
StatusLabel.TextColor3 = Color3.fromRGB(180, 180, 180)
StatusLabel.TextSize = 12
StatusLabel.Font = Enum.Font.Gotham
StatusLabel.TextXAlignment = Enum.TextXAlignment.Left
StatusLabel.Parent = MainFrame

-- Barra de progreso fondo
local BarBG = Instance.new("Frame")
BarBG.Size = UDim2.new(1, -20, 0, 20)
BarBG.Position = UDim2.new(0, 10, 0, 118)
BarBG.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
BarBG.BorderSizePixel = 0
BarBG.Parent = MainFrame

local UICornerBar = Instance.new("UICorner")
UICornerBar.CornerRadius = UDim.new(0, 6)
UICornerBar.Parent = BarBG

-- Barra de progreso fill
local BarFill = Instance.new("Frame")
BarFill.Size = UDim2.new(0, 0, 1, 0)
BarFill.BackgroundColor3 = Color3.fromRGB(50, 180, 100)
BarFill.BorderSizePixel = 0
BarFill.Parent = BarBG

local UICornerFill = Instance.new("UICorner")
UICornerFill.CornerRadius = UDim.new(0, 6)
UICornerFill.Parent = BarFill

-- Porcentaje
local PercentLabel = Instance.new("TextLabel")
PercentLabel.Size = UDim2.new(1, 0, 1, 0)
PercentLabel.BackgroundTransparency = 1
PercentLabel.Text = "0%"
PercentLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
PercentLabel.TextSize = 11
PercentLabel.Font = Enum.Font.GothamBold
PercentLabel.Parent = BarBG

-- Contador
local CountLabel = Instance.new("TextLabel")
CountLabel.Size = UDim2.new(1, -20, 0, 20)
CountLabel.Position = UDim2.new(0, 10, 0, 145)
CountLabel.BackgroundTransparency = 1
CountLabel.Text = "Scripts: 0 | Fallidos: 0"
CountLabel.TextColor3 = Color3.fromRGB(150, 150, 150)
CountLabel.TextSize = 11
CountLabel.Font = Enum.Font.Gotham
CountLabel.TextXAlignment = Enum.TextXAlignment.Left
CountLabel.Parent = MainFrame

-- Boton descargar
local DumpBtn = Instance.new("TextButton")
DumpBtn.Size = UDim2.new(1, -20, 0, 38)
DumpBtn.Position = UDim2.new(0, 10, 0, 170)
DumpBtn.BackgroundColor3 = Color3.fromRGB(50, 130, 220)
DumpBtn.Text = "⬇ DESCARGAR JUEGO"
DumpBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
DumpBtn.TextSize = 14
DumpBtn.Font = Enum.Font.GothamBold
DumpBtn.BorderSizePixel = 0
DumpBtn.Parent = MainFrame

local UICornerBtn = Instance.new("UICorner")
UICornerBtn.CornerRadius = UDim.new(0, 8)
UICornerBtn.Parent = DumpBtn

-- Hacer draggable
local dragging, dragInput, dragStart, startPos
TitleBar.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 then
        dragging = true
        dragStart = input.Position
        startPos = MainFrame.Position
    end
end)
TitleBar.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 then
        dragging = false
    end
end)
game:GetService("UserInputService").InputChanged:Connect(function(input)
    if dragging and input.UserInputType == Enum.UserInputType.MouseMoved then
        local delta = input.Position - dragStart
        MainFrame.Position = UDim2.new(
            startPos.X.Scale,
            startPos.X.Offset + delta.X,
            startPos.Y.Scale,
            startPos.Y.Offset + delta.Y
        )
    end
end)

CloseBtn.MouseButton1Click:Connect(function()
    ScreenGui:Destroy()
end)

-- =============================================
-- LOGICA DE DUMP
-- =============================================

local function setStatus(text, color)
    StatusLabel.Text = "Estado: " .. text
    StatusLabel.TextColor3 = color or Color3.fromRGB(180, 180, 180)
end

local function setProgress(current, total)
    local pct = math.floor((current / total) * 100)
    local tween = TweenService:Create(BarFill, TweenInfo.new(0.1), {
        Size = UDim2.new(current / total, 0, 1, 0)
    })
    tween:Play()
    PercentLabel.Text = pct .. "%"
end

local function sanitizePath(path)
    return path:gsub("[<>:\"/\\|?*]", "_")
end

local function ensureFolders(path)
    local parts = {}
    for part in path:gmatch("[^/]+") do
        parts[#parts + 1] = part
    end
    local current = ""
    for _, part in ipairs(parts) do
        current = current == "" and part or current .. "/" .. part
        if not isfolder(current) then
            pcall(makefolder, current)
        end
    end
end

DumpBtn.MouseButton1Click:Connect(function()
    -- Verificar writefile
    if type(writefile) ~= "function" then
        setStatus("ERROR: Tu executor no soporta writefile", Color3.fromRGB(220, 80, 80))
        DumpBtn.BackgroundColor3 = Color3.fromRGB(220, 80, 80)
        DumpBtn.Text = "✗ EXECUTOR NO COMPATIBLE"
        return
    end

    DumpBtn.Active = false
    DumpBtn.BackgroundColor3 = Color3.fromRGB(80, 80, 80)
    DumpBtn.Text = "Dumpeando..."

    local folderName = "games/" .. sanitizePath(gameName)

    -- Crear carpetas base
    if not isfolder("games") then makefolder("games") end
    if not isfolder(folderName) then makefolder(folderName) end

    -- Recolectar todos los scripts
    setStatus("Recolectando scripts...", Color3.fromRGB(255, 200, 50))
    local scripts = {}
    for _, obj in pairs(game:GetDescendants()) do
        if obj:IsA("LocalScript") or obj:IsA("ModuleScript") or obj:IsA("Script") then
            scripts[#scripts + 1] = obj
        end
    end

    local total = #scripts
    local dumped = 0
    local failed = 0

    if total == 0 then
        setStatus("ERROR: No se encontraron scripts", Color3.fromRGB(220, 80, 80))
        DumpBtn.BackgroundColor3 = Color3.fromRGB(220, 80, 80)
        DumpBtn.Text = "✗ SIN SCRIPTS"
        return
    end

    setStatus("Dumpeando " .. total .. " scripts...", Color3.fromRGB(255, 200, 50))

    for i, obj in ipairs(scripts) do
        local ok, source = pcall(function() return obj.Source end)

        if ok and source and source ~= "" then
            local relativePath = sanitizePath(obj:GetFullName():gsub("%.", "/"))
            local fullFolder = folderName .. "/" .. (relativePath:match("(.+)/[^/]+$") or "")
            ensureFolders(fullFolder)
            local filename = folderName .. "/" .. relativePath .. ".lua"
            local writeOk = pcall(writefile, filename, source)
            if writeOk then
                dumped = dumped + 1
            else
                failed = failed + 1
            end
        else
            failed = failed + 1
        end

        setProgress(i, total)
        CountLabel.Text = "Scripts: " .. dumped .. " | Fallidos: " .. failed
        if i % 10 == 0 then task.wait() end
    end

    -- Resultado final
    if dumped > 0 then
        setStatus("✓ Completado! " .. dumped .. " scripts guardados", Color3.fromRGB(100, 220, 100))
        DumpBtn.BackgroundColor3 = Color3.fromRGB(50, 180, 100)
        DumpBtn.Text = "✓ COMPLETADO - " .. dumped .. " scripts"
        BarFill.BackgroundColor3 = Color3.fromRGB(50, 180, 100)
    else
        setStatus("ERROR: No se pudo guardar ningún script", Color3.fromRGB(220, 80, 80))
        DumpBtn.BackgroundColor3 = Color3.fromRGB(220, 80, 80)
        DumpBtn.Text = "✗ ERROR AL GUARDAR"
        BarFill.BackgroundColor3 = Color3.fromRGB(220, 80, 80)
    end
end)

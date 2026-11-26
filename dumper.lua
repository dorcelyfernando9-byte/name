-- =============================================
--         SUPERSTAR BASEBALL DUMPER
--         Manda archivos a API en Render
-- =============================================

local Players     = game:GetService("Players")
local TweenService= game:GetService("TweenService")
local HttpService = game:GetService("HttpService")
local LocalPlayer = Players.LocalPlayer

-- URL de la API
local API_URL = "https://smb-dump-api.onrender.com/upload"

-- Detectar juego
local gameName = game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId).Name

-- =============================================
-- GUI
-- =============================================
local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "DumperGUI"
ScreenGui.ResetOnSpawn = false
ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
ScreenGui.Parent = LocalPlayer.PlayerGui

local MainFrame = Instance.new("Frame")
MainFrame.Size = UDim2.new(0, 400, 0, 220)
MainFrame.Position = UDim2.new(0.5, -200, 0.5, -110)
MainFrame.BackgroundColor3 = Color3.fromRGB(18, 18, 18)
MainFrame.BorderSizePixel = 0
MainFrame.Parent = ScreenGui
Instance.new("UICorner", MainFrame).CornerRadius = UDim.new(0, 10)

local TitleBar = Instance.new("Frame")
TitleBar.Size = UDim2.new(1, 0, 0, 40)
TitleBar.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
TitleBar.BorderSizePixel = 0
TitleBar.Parent = MainFrame
Instance.new("UICorner", TitleBar).CornerRadius = UDim.new(0, 10)

local Title = Instance.new("TextLabel")
Title.Size = UDim2.new(1, -10, 1, 0)
Title.Position = UDim2.new(0, 10, 0, 0)
Title.BackgroundTransparency = 1
Title.Text = "☁ DUMPER → RENDER API"
Title.TextColor3 = Color3.fromRGB(255, 255, 255)
Title.TextSize = 15
Title.Font = Enum.Font.GothamBold
Title.TextXAlignment = Enum.TextXAlignment.Left
Title.Parent = TitleBar

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
Instance.new("UICorner", CloseBtn).CornerRadius = UDim.new(0, 6)

local GameLabel = Instance.new("TextLabel")
GameLabel.Size = UDim2.new(1, -20, 0, 25)
GameLabel.Position = UDim2.new(0, 10, 0, 48)
GameLabel.BackgroundTransparency = 1
GameLabel.Text = "🎮 " .. gameName
GameLabel.TextColor3 = Color3.fromRGB(100, 220, 100)
GameLabel.TextSize = 12
GameLabel.Font = Enum.Font.Gotham
GameLabel.TextXAlignment = Enum.TextXAlignment.Left
GameLabel.TextTruncate = Enum.TextTruncate.AtEnd
GameLabel.Parent = MainFrame

local StatusLabel = Instance.new("TextLabel")
StatusLabel.Size = UDim2.new(1, -20, 0, 25)
StatusLabel.Position = UDim2.new(0, 10, 0, 76)
StatusLabel.BackgroundTransparency = 1
StatusLabel.Text = "Estado: Esperando..."
StatusLabel.TextColor3 = Color3.fromRGB(180, 180, 180)
StatusLabel.TextSize = 12
StatusLabel.Font = Enum.Font.Gotham
StatusLabel.TextXAlignment = Enum.TextXAlignment.Left
StatusLabel.Parent = MainFrame

local BarBG = Instance.new("Frame")
BarBG.Size = UDim2.new(1, -20, 0, 20)
BarBG.Position = UDim2.new(0, 10, 0, 108)
BarBG.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
BarBG.BorderSizePixel = 0
BarBG.Parent = MainFrame
Instance.new("UICorner", BarBG).CornerRadius = UDim.new(0, 6)

local BarFill = Instance.new("Frame")
BarFill.Size = UDim2.new(0, 0, 1, 0)
BarFill.BackgroundColor3 = Color3.fromRGB(50, 130, 220)
BarFill.BorderSizePixel = 0
BarFill.Parent = BarBG
Instance.new("UICorner", BarFill).CornerRadius = UDim.new(0, 6)

local PercentLabel = Instance.new("TextLabel")
PercentLabel.Size = UDim2.new(1, 0, 1, 0)
PercentLabel.BackgroundTransparency = 1
PercentLabel.Text = "0%"
PercentLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
PercentLabel.TextSize = 11
PercentLabel.Font = Enum.Font.GothamBold
PercentLabel.Parent = BarBG

local CountLabel = Instance.new("TextLabel")
CountLabel.Size = UDim2.new(1, -20, 0, 20)
CountLabel.Position = UDim2.new(0, 10, 0, 135)
CountLabel.BackgroundTransparency = 1
CountLabel.Text = "Enviados: 0 | Fallidos: 0"
CountLabel.TextColor3 = Color3.fromRGB(150, 150, 150)
CountLabel.TextSize = 11
CountLabel.Font = Enum.Font.Gotham
CountLabel.TextXAlignment = Enum.TextXAlignment.Left
CountLabel.Parent = MainFrame

local DumpBtn = Instance.new("TextButton")
DumpBtn.Size = UDim2.new(1, -20, 0, 38)
DumpBtn.Position = UDim2.new(0, 10, 0, 162)
DumpBtn.BackgroundColor3 = Color3.fromRGB(50, 130, 220)
DumpBtn.Text = "☁ ENVIAR A RENDER"
DumpBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
DumpBtn.TextSize = 14
DumpBtn.Font = Enum.Font.GothamBold
DumpBtn.BorderSizePixel = 0
DumpBtn.Parent = MainFrame
Instance.new("UICorner", DumpBtn).CornerRadius = UDim.new(0, 8)

-- Draggable
local dragging, dragStart, startPos
TitleBar.InputBegan:Connect(function(i)
    if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then
        dragging = true; dragStart = i.Position; startPos = MainFrame.Position
    end
end)
TitleBar.InputEnded:Connect(function(i)
    if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then
        dragging = false
    end
end)
game:GetService("UserInputService").InputChanged:Connect(function(i)
    if dragging and (i.UserInputType == Enum.UserInputType.MouseMovement or i.UserInputType == Enum.UserInputType.Touch) then
        local d = i.Position - dragStart
        MainFrame.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + d.X, startPos.Y.Scale, startPos.Y.Offset + d.Y)
    end
end)
CloseBtn.MouseButton1Click:Connect(function() ScreenGui:Destroy() end)

-- =============================================
-- LOGICA
-- =============================================
local function setStatus(text, color)
    StatusLabel.Text = "Estado: " .. text
    StatusLabel.TextColor3 = color or Color3.fromRGB(180, 180, 180)
end

local function setProgress(current, total)
    local pct = math.floor((current / total) * 100)
    TweenService:Create(BarFill, TweenInfo.new(0.08), {
        Size = UDim2.new(current / total, 0, 1, 0)
    }):Play()
    PercentLabel.Text = pct .. "%"
end

local function sanitizeName(path)
    return path:gsub("[<>:\"/\\|?*]", "_")
end

local function sendToAPI(name, source)
    local body = HttpService:JSONEncode({
        name     = name,
        content  = source,
        encoding = "plain"
    })

    -- Delta usa httpRequest o request
    local req = httpRequest or request or (syn and syn.request) or (http and http.request)
    if not req then
        return false, "no http function"
    end

    local ok, err = pcall(function()
        req({
            Url     = API_URL,
            Method  = "POST",
            Headers = { ["Content-Type"] = "application/json" },
            Body    = body
        })
    end)
    return ok, err
end

DumpBtn.MouseButton1Click:Connect(function()
    DumpBtn.Active = false
    DumpBtn.BackgroundColor3 = Color3.fromRGB(80, 80, 80)
    DumpBtn.Text = "Enviando..."

    setStatus("Recolectando scripts...", Color3.fromRGB(255, 200, 50))
    task.wait()

    local scripts = {}
    for _, obj in pairs(game:GetDescendants()) do
        if obj:IsA("LocalScript") or obj:IsA("ModuleScript") or obj:IsA("Script") then
            scripts[#scripts + 1] = obj
        end
    end

    local total = #scripts
    if total == 0 then
        setStatus("No se encontraron scripts", Color3.fromRGB(220, 80, 80))
        DumpBtn.Text = "✗ SIN SCRIPTS"
        return
    end

    task.spawn(function()
        local sent   = 0
        local failed = 0
        local hasDecompile = type(decompile) == "function"

        -- Debug: detectar qué función HTTP tiene Delta
        local httpFn = httpRequest or request or (syn and syn.request) or (http and http.request)
        if not httpFn then
            setStatus("ERROR: Delta no tiene función HTTP", Color3.fromRGB(220, 80, 80))
            DumpBtn.Text = "✗ SIN HTTP"
            DumpBtn.BackgroundColor3 = Color3.fromRGB(220, 80, 80)
            return
        end

        setStatus("Enviando " .. total .. " scripts a Render...", Color3.fromRGB(80, 160, 255))

        for i, obj in ipairs(scripts) do
            local source = nil

            -- Intentar Source
            local ok, result = pcall(function() return obj.Source end)
            if ok and result and result ~= "" then
                source = result
            end

            -- Intentar decompile si no hay Source
            if not source and hasDecompile then
                local dok, dresult = pcall(decompile, obj)
                if dok and dresult and dresult ~= "" then
                    source = dresult
                end
            end

            if source then
                local name = sanitizeName(obj:GetFullName():gsub("%.", "/")) .. ".lua"
                local uploadOk = sendToAPI(name, source)
                if uploadOk then sent = sent + 1 else failed = failed + 1 end
            else
                failed = failed + 1
            end

            -- UI cada 20 scripts + pausa mínima
            if i % 20 == 0 then
                setProgress(i, total)
                CountLabel.Text = "Enviados: " .. sent .. " | Fallidos: " .. failed
                task.wait()
            end
        end

        setProgress(total, total)
        CountLabel.Text = "Enviados: " .. sent .. " | Fallidos: " .. failed

        if sent > 0 then
            setStatus("✓ " .. sent .. " scripts en Render!", Color3.fromRGB(100, 220, 100))
            DumpBtn.BackgroundColor3 = Color3.fromRGB(50, 180, 100)
            DumpBtn.Text = "✓ " .. sent .. " enviados"
            BarFill.BackgroundColor3 = Color3.fromRGB(50, 180, 100)
        else
            setStatus("ERROR: No se pudo enviar nada", Color3.fromRGB(220, 80, 80))
            DumpBtn.BackgroundColor3 = Color3.fromRGB(220, 80, 80)
            DumpBtn.Text = "✗ ERROR"
            BarFill.BackgroundColor3 = Color3.fromRGB(220, 80, 80)
        end
    end)
end)

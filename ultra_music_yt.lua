-- Ultra Music: reproductor con Jamendo + música local para Delta (Roblox)
-- 1) Ejecuta el script. La primera vez te pide tu clave (client_id) gratis de Jamendo:
--    crea una cuenta y una aplicación en devportal.jamendo.com y copia su client_id.
-- 2) Sin clave puedes entrar igual con "Música local": pon tus .mp3 / .ogg en la
--    carpeta DeltaMusica/Local del workspace de tu executor.
-- 3) Botón de la derecha del buscador = cambia de fuente. Cicla:
--    Local -> Descargas (sin clave ni internet) -> Jamendo (y cualquier fuente nueva de PROVEEDORES).
--    Escribe /clave en el buscador para cambiar tu clave.
--    Barra de volumen bajo el título (hasta 200%; el altavoz silencia).
--    Modos compactos (botón "–" de la barra de título; se elige en el engranaje > Compacto):
--      * Barra: barra arriba con atrás / play / siguiente.
--      * Circular: un círculo pequeño. Toca = play/pausa. Mantén pulsado = abrir el reproductor.
--      En la barra, toca el título para pasar a Circular; el botón de la derecha vuelve a la ventana.
--      El círculo muestra la portada de la canción.
--    Pie de la ventana: tu avatar y nombre, el nombre del juego (en inglés) y su ID. Toca cualquiera para copiarlo.
--    Se oculta desde el engranaje (Info) si necesitas más espacio en pantalla.
--    Para añadir otra fuente de música (SoundCloud, etc.) mira la sección PROVEEDORES.
--    Dos pestañas: "Reproductor" (portada, título, volumen, progreso y controles juntos) y
--    "Buscar" (fuente, búsqueda y resultados, con un mini reproductor abajo).
--    Los botones tienen animación y sonido de clic; la ventana se "levanta" al arrastrarla.
--    Los efectos se apagan desde el engranaje (Sonidos / Animaciones).
--    El visualizador usa el espectro real (AudioPlayer + AudioAnalyzer) si tu cliente lo soporta;
--    si no, vuelve solo a las ondas simuladas. La portada va detrás de las barras.
--    Portadas locales: se leen de la etiqueta ID3 del .mp3 (la imagen incrustada). Si no trae,
--    puedes poner "Artista - Título.jpg" (o .png) junto a la canción en DeltaMusica/Local.
--    En Jamendo, buscador vacío + Enter = canciones ya descargadas.
-- 4) Engranaje de la barra de título = apariencia (tema, forma, tamaño y opacidad).
--    Tus ajustes se guardan en DeltaMusica/config.json.

local CARPETA = "DeltaMusica"
local DESCARGAS = CARPETA .. "/Descargas"
local LOCAL = CARPETA .. "/Local"
local PORTADAS = CARPETA .. "/Portadas"
local CONFIG = CARPETA .. "/config.json"
local INDICE = CARPETA .. "/indice.json"
local API = "https://api.jamendo.com/v3.0"
local PORTAL = "https://devportal.jamendo.com"
local YT_API = "http://swichert.wisp.uno:12119"
local VOL_MAX = 2 -- volumen máximo (1 = 100%; por encima amplifica y puede distorsionar)

local Players = game:GetService("Players")
local UIS = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local HttpService = game:GetService("HttpService")
local SoundService = game:GetService("SoundService")
local TweenService = game:GetService("TweenService")
local lp = Players.LocalPlayer

local req = request or http_request or (syn and syn.request)
if not (writefile and readfile and isfile and getcustomasset and listfiles and makefolder and isfolder) then
	warn("Tu executor no soporta lo necesario (archivos o getcustomasset)")
	return
end

-- ===== Idiomas =====
-- Español incrustado como respaldo. Si el cargador dejó DeltaMusicaIdioma = "en" (por ejemplo),
-- se lee DeltaMusica/Idiomas/en.json (solo datos JSON, nunca código) y sus textos reemplazan a los de aquí.
local TXT = {
	tema_violeta = "Violeta",
	tema_oceano = "Océano",
	tema_atardecer = "Atardecer",
	tema_bosque = "Bosque",
	tema_chicle = "Chicle",
	tema_carbon = "Carbón",
	tema_rojo = "Rojo",
	tema_dorado = "Dorado",
	tab_player = "Reproductor",
	tab_buscar = "Buscar",
	siguiente_lbl = "SIGUIENTE",
	toca_abrir = "Toca para abrir el reproductor",
	login_titulo = "Entra con Jamendo",
	login_desc = "Pega tu clave (client_id) gratis de Jamendo. Crea una aplicación en devportal.jamendo.com y copia su client_id.",
	login_ph = "Pega tu clave aquí",
	entrar = "Entrar",
	copiar_portal = "Copiar enlace del portal",
	musica_local = "Música local",
	login_sin_clave = "Sin clave puedes usar Música local: pon tus archivos .mp3 o .ogg en la carpeta DeltaMusica/Local de tu executor.",
	ajuste_tema = "Tema",
	restablecer = "Restablecer",
	forma = "Forma",
	tamano = "Tamaño",
	opacidad = "Opacidad",
	redondo = "Redondo",
	suave = "Suave",
	recto = "Recto",
	pequeno = "Pequeño",
	medio = "Medio",
	maximo = "Máximo",
	cristal = "Cristal",
	solido = "Sólido",
	sonidos = "Sonidos",
	animaciones = "Animaciones",
	si = "Sí",
	no = "No",
	chip_estado = "{1}: {2}",
	listo = "Listo",
	vacio_descargas = "Aún no hay descargas: se guardan al reproducir desde Jamendo",
	vacio_local = "Sin música: pon .mp3/.ogg en DeltaMusica/Local",
	estado_lista = "{1} · {2} canciones",
	estado_filtro = "{1} de {2} canciones",
	descargadas = "Descargadas",
	err_no_archivo = "No se encontró el archivo",
	err_sin_request = "Tu executor no soporta request",
	err_descarga = "No se pudo descargar la canción",
	err_http = "Error de descarga {1}",
	err_vacia = "La descarga llegó vacía",
	err_audio_invalido = "Jamendo no devolvió un audio válido",
	aleatorio = "Aleatorio",
	fin_lista = "Fin de la lista",
	sin_titulo = "Sin título",
	otra_vez = "{1} (otra vez)",
	cargando = "Cargando canción...",
	err_cargar = "No se pudo cargar",
	err_leer = "Error al leer el archivo",
	err_audio = "No se pudo leer el audio (¿archivo dañado?)",
	err_conectar = "No se pudo conectar a Jamendo",
	err_resp_cod = "Respuesta inesperada de Jamendo (código {1})",
	clave_invalida = "Clave inválida",
	necesitas_clave = "Necesitas tu clave de Jamendo",
	buscando = "Buscando...",
	err_respuesta = "Respuesta inesperada de Jamendo",
	err_jamendo = "Jamendo devolvió un error",
	sin_resultados = "Sin resultados",
	n_resultados = "{1} resultados",
	clave_nueva = "Escribe tu clave nueva",
	modo_local = "Local",
	modo_descargas = "Descargas",
	filtrar_local = "Filtrar tu música local",
	filtrar_descargas = "Filtrar tus descargas",
	buscar_jamendo = "Buscar en Jamendo",
	buscar_youtube = "Buscar o pegar link de YouTube",
	aviso_modo = "Escribe algo y pulsa Enter · /clave cambia tu clave",
	clave_primero = "Pega tu clave primero",
	comprobando = "Comprobando clave...",
	enlace_copiado = "Enlace copiado: pégalo en tu navegador",
	abre_navegador = "Abre {1} en tu navegador",
	clave_caduca = "Tu clave ya no sirve: {1}",
	para_jamendo = "Para usar Jamendo necesitas tu clave",
	n_de_m = "{1} de {2}",
	compacto = "Compacto",
	barra = "Barra",
	circular = "Circular",
	ver_mas = "Ver más ({1} de {2})",
	info = "Info",
	id_juego = "ID {1} · copiar",
	copiado = "¡Copiado!",
	no_copiar = "Tu executor no puede copiar",
}
do
	local okG, cod = pcall(function() return getgenv and getgenv().DeltaMusicaIdioma end)
	if okG and type(cod) == "string" and #cod <= 8 and cod:match("^[%a%-]+$") then
		local ruta = "DeltaMusica/Idiomas/" .. cod .. ".json"
		local okL, datos = pcall(function()
			if not isfile(ruta) then return nil end
			return HttpService:JSONDecode(readfile(ruta))
		end)
		if okL and type(datos) == "table" then
			local textos = type(datos.textos) == "table" and datos.textos or datos
			for k, v in pairs(textos) do
				if TXT[k] ~= nil and type(v) == "string" and #v > 0 and #v <= 300 then TXT[k] = v end
			end
		end
	end
end
local function T(clave, ...)
	local s = TXT[clave] or clave
	local n = select("#", ...)
	if n > 0 then
		local a = { ... }
		s = (s:gsub("{(%d)}", function(i)
			local v = a[tonumber(i)]
			if v ~= nil then return tostring(v) end
		end))
	end
	return s
end
for _, c in ipairs({ CARPETA, DESCARGAS, LOCAL, PORTADAS }) do
	if not isfolder(c) then makefolder(c) end
end

-- Temas de color: nombre, panel, fondo de listas, acento, acento 2, texto secundario
local function tema(n, p, f, a, r, t)
	return {
		nombre = n,
		panel = Color3.fromRGB(table.unpack(p)), fondo = Color3.fromRGB(table.unpack(f)),
		acento = Color3.fromRGB(table.unpack(a)), rosa = Color3.fromRGB(table.unpack(r)),
		texto2 = Color3.fromRGB(table.unpack(t)),
	}
end
local TEMAS = {
	tema(T("tema_violeta"), { 38, 14, 72 }, { 10, 3, 24 }, { 179, 92, 255 }, { 240, 107, 255 }, { 235, 220, 255 }),
	tema(T("tema_oceano"), { 10, 36, 66 }, { 3, 12, 26 }, { 56, 160, 255 }, { 80, 230, 230 }, { 215, 235, 255 }),
	tema(T("tema_atardecer"), { 66, 22, 28 }, { 24, 6, 10 }, { 255, 120, 80 }, { 255, 190, 70 }, { 255, 230, 215 }),
	tema(T("tema_bosque"), { 14, 52, 40 }, { 3, 20, 14 }, { 60, 200, 120 }, { 190, 235, 90 }, { 220, 250, 230 }),
	tema(T("tema_chicle"), { 72, 18, 52 }, { 26, 4, 18 }, { 255, 92, 170 }, { 255, 150, 210 }, { 255, 224, 240 }),
	tema(T("tema_carbon"), { 30, 30, 34 }, { 12, 12, 14 }, { 150, 150, 165 }, { 230, 230, 240 }, { 235, 235, 240 }),
	tema(T("tema_rojo"), { 62, 12, 16 }, { 22, 3, 5 }, { 235, 64, 72 }, { 255, 125, 100 }, { 255, 225, 225 }),
	tema(T("tema_dorado"), { 54, 40, 10 }, { 20, 14, 2 }, { 235, 180, 40 }, { 255, 225, 110 }, { 255, 245, 215 }),
}

-- Configuración guardada: clave de Jamendo y apariencia
local clave = nil
-- compacto: 1 = barra, 2 = circular. alea: 0/1. rep: 0 = no, 1 = todo, 2 = uno
local AJ = { tema = 1, forma = 1, tam = 1, opac = 0.35, vol = 0.8, sonidos = 1, anim = 1, compacto = 1, alea = 0, rep = 0, info = 1 }
if isfile(CONFIG) then
	local ok, d = pcall(function() return HttpService:JSONDecode(readfile(CONFIG)) end)
	if ok and type(d) == "table" then
		if type(d.clave) == "string" and d.clave ~= "" then clave = d.clave end
		if type(d.ajustes) == "table" then
			for k in pairs(AJ) do
				if type(d.ajustes[k]) == "number" then AJ[k] = d.ajustes[k] end
			end
		end
	end
end
AJ.tema = TEMAS[AJ.tema] and AJ.tema or 1
AJ.forma = math.clamp(AJ.forma, 0, 1)
do -- el tamaño solo admite los valores del menú (configs viejas: se ajustan al más cercano)
	local mejor = 1
	for _, v in ipairs({ 0.7, 0.85, 1 }) do
		if math.abs(v - AJ.tam) < math.abs(mejor - AJ.tam) then mejor = v end
	end
	AJ.tam = mejor
end
AJ.vol = math.clamp(AJ.vol, 0, VOL_MAX)
AJ.sonidos = (AJ.sonidos == 0) and 0 or 1
AJ.anim = (AJ.anim == 0) and 0 or 1
AJ.opac = math.clamp(AJ.opac, 0, 0.9)
AJ.compacto = (AJ.compacto == 2) and 2 or 1
AJ.info = (AJ.info == 0) and 0 or 1 -- 1 = mostrar el pie (jugador, juego e ID)
AJ.alea = (AJ.alea == 1) and 1 or 0
AJ.rep = (AJ.rep == 1 or AJ.rep == 2) and AJ.rep or 0
local function guardarConfig()
	pcall(function() writefile(CONFIG, HttpService:JSONEncode({ clave = clave or "", ajustes = AJ })) end)
end

-- Colores y apariencia actuales (se pueden cambiar en vivo desde el engranaje)
local PANEL, FONDO_LISTA = TEMAS[AJ.tema].panel, TEMAS[AJ.tema].fondo
local ACENTO, ROSA = TEMAS[AJ.tema].acento, TEMAS[AJ.tema].rosa
local TEXTO2 = TEMAS[AJ.tema].texto2
local BLANCO = Color3.new(1, 1, 1)
local FORMA, TAM, OPAC = AJ.forma, AJ.tam, AJ.opac
local registroEsq = setmetatable({}, { __mode = "k" })

-- Limpia una ejecución anterior
local contenedor = (gethui and gethui()) or game:GetService("CoreGui")
do
	local viejo = contenedor:FindFirstChild("DeltaMusica")
	if viejo then viejo:Destroy() end
	local viejoSonido = SoundService:FindFirstChild("DeltaMusicaSound")
	if viejoSonido then viejoSonido:Destroy() end
	local viejoClic = SoundService:FindFirstChild("DeltaMusicaClic")
	if viejoClic then viejoClic:Destroy() end
end
local clicSnd = Instance.new("Sound")
clicSnd.Name = "DeltaMusicaClic"
clicSnd.Volume = 0.4
clicSnd.Parent = SoundService

local gui = Instance.new("ScreenGui")
gui.Name = "DeltaMusica"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.DisplayOrder = 100
if not pcall(function() gui.Parent = contenedor end) then
	gui.Parent = lp:WaitForChild("PlayerGui")
end

local conexiones = {}
local function conectar(senal, f)
	local c = senal:Connect(f)
	table.insert(conexiones, c)
	return c
end

-- Ayudas de interfaz
local function nuevo(clase, props, padre)
	local o = Instance.new(clase)
	for k, v in pairs(props) do o[k] = v end
	o.Parent = padre
	return o
end
local function esquinas(o, r)
	local c = nuevo("UICorner", { CornerRadius = UDim.new(0, math.floor(r * FORMA + 0.5)) }, o)
	registroEsq[c] = r
end
local function degradado(o) nuevo("UIGradient", { Color = ColorSequence.new(ACENTO, ROSA) }, o) end
local function texto(padre, props)
	local base = {
		BackgroundTransparency = 1, BorderSizePixel = 0, Font = Enum.Font.GothamMedium,
		TextColor3 = BLANCO, TextSize = 12, TextXAlignment = Enum.TextXAlignment.Left,
	}
	for k, v in pairs(props) do base[k] = v end
	return nuevo("TextLabel", base, padre)
end

-- Animaciones y sonido de interfaz (se apagan con AJ.anim / AJ.sonidos)
local function tween(o, t, props, estilo, dir)
	if AJ.anim ~= 1 or t <= 0 then
		for k, v in pairs(props) do pcall(function() o[k] = v end) end
		return nil
	end
	local ok, tw = pcall(function()
		local x = TweenService:Create(o, TweenInfo.new(t, estilo or Enum.EasingStyle.Quint, dir or Enum.EasingDirection.Out), props)
		x:Play()
		return x
	end)
	return ok and tw or nil
end
local CLIC = { listo = false }
local function clic(tono)
	if AJ.sonidos ~= 1 or not CLIC.listo then return end
	pcall(function()
		clicSnd.PlaybackSpeed = tono or 1
		clicSnd.TimePosition = 0
		clicSnd:Play()
	end)
end
-- Anillo que se expande y se desvanece alrededor del botón pulsado
local function ping(b)
	if AJ.anim ~= 1 then return end
	pcall(function()
		local esq = b:FindFirstChildOfClass("UICorner")
		local r = esq and esq.CornerRadius.Offset or 0
		local anillo = nuevo("Frame", {
			Name = "Ping", AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5),
			Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, BorderSizePixel = 0, ZIndex = 5,
		}, b)
		nuevo("UICorner", { CornerRadius = UDim.new(0, r + 6) }, anillo)
		local trazo = nuevo("UIStroke", { Color = ROSA, Thickness = 2, Transparency = 0.15 }, anillo)
		tween(anillo, 0.4, { Size = UDim2.new(1, 12, 1, 12) })
		tween(trazo, 0.4, { Transparency = 1 })
		task.delay(0.45, function() anillo:Destroy() end)
	end)
end

local function boton(padre, props)
	local base = { BackgroundTransparency = 1, Text = "", AutoButtonColor = false, BorderSizePixel = 0 }
	for k, v in pairs(props) do base[k] = v end
	local b = nuevo("TextButton", base, padre)
	b.MouseButton1Down:Connect(function()
		if b:GetAttribute("sinfx") then return end
		clic(b:GetAttribute("tono"))
		ping(b)
	end)
	return b
end

-- Iconos dibujados con frames (sin imágenes)
local ICONO = {}
local function triangulo(padre, w, h, color, izq)
	-- w debe ser h / 2. Apunta a la derecha, o a la izquierda si izq = true
	local clip = nuevo("Frame", {
		Size = UDim2.fromOffset(w, h), BackgroundTransparency = 1, ClipsDescendants = true, BorderSizePixel = 0,
	}, padre)
	local s = h / math.sqrt(2)
	nuevo("Frame", {
		Size = UDim2.fromOffset(s, s), AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.new(izq and 1 or 0, 0, 0.5, 0), Rotation = 45,
		BackgroundColor3 = color, BorderSizePixel = 0,
	}, clip)
	return clip
end
local function linea(padre, largo, grosor, rot, pos)
	return nuevo("Frame", {
		Size = UDim2.fromOffset(largo, grosor), AnchorPoint = Vector2.new(0.5, 0.5),
		Position = pos or UDim2.fromScale(0.5, 0.5), Rotation = rot,
		BackgroundColor3 = BLANCO, BorderSizePixel = 0,
	}, padre)
end
local function centrado(padre, w, h, clase)
	return nuevo(clase or "Frame", {
		Size = UDim2.fromOffset(w, h), AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5), BackgroundTransparency = 1, BorderSizePixel = 0,
	}, padre)
end
function ICONO.iconoPlay(btn)
	local c = centrado(btn, 10, 20)
	c.Position = UDim2.new(0.5, 2, 0.5, 0)
	triangulo(c, 10, 20, BLANCO)
	return c
end
function ICONO.iconoPausa(btn)
	local c = centrado(btn, 16, 18)
	for _, x in ipairs({ 0, 10 }) do
		local b = nuevo("Frame", { Size = UDim2.fromOffset(6, 18), Position = UDim2.fromOffset(x, 0), BackgroundColor3 = BLANCO, BorderSizePixel = 0 }, c)
		esquinas(b, 2)
	end
	return c
end
function ICONO.iconoSalto(btn, hacia)
	local c = centrado(btn, 14, 18)
	if hacia == "ant" then
		nuevo("Frame", { Size = UDim2.fromOffset(3, 18), BackgroundColor3 = BLANCO, BorderSizePixel = 0 }, c)
		local t = triangulo(c, 9, 18, BLANCO, true)
		t.Position = UDim2.fromOffset(5, 0)
	else
		triangulo(c, 9, 18, BLANCO)
		nuevo("Frame", { Size = UDim2.fromOffset(3, 18), Position = UDim2.fromOffset(11, 0), BackgroundColor3 = BLANCO, BorderSizePixel = 0 }, c)
	end
	return c
end
function ICONO.iconoAleatorio(btn)
	local g = centrado(btn, 24, 18, "CanvasGroup")
	linea(g, 20, 2, 30)
	linea(g, 20, 2, -30)
	triangulo(g, 4, 8, BLANCO).Position = UDim2.fromOffset(19, 0)
	triangulo(g, 4, 8, BLANCO).Position = UDim2.fromOffset(19, 10)
	return g
end
function ICONO.iconoRepetir(btn)
	local g = centrado(btn, 22, 16, "CanvasGroup")
	local marco = nuevo("Frame", { Size = UDim2.fromOffset(18, 9), Position = UDim2.fromOffset(2, 4), BackgroundTransparency = 1, BorderSizePixel = 0 }, g)
	esquinas(marco, 4)
	nuevo("UIStroke", { Color = BLANCO, Thickness = 2 }, marco)
	triangulo(g, 4, 8, BLANCO).Position = UDim2.fromOffset(12, 0)
	triangulo(g, 4, 8, BLANCO, true).Position = UDim2.fromOffset(6, 8)
	return g
end
function ICONO.iconoCerrar(btn)
	local c = centrado(btn, 14, 14)
	linea(c, 16, 2.4, 45)
	linea(c, 16, 2.4, -45)
end
function ICONO.iconoMinimizar(btn)
	local c = centrado(btn, 12, 3)
	c.BackgroundTransparency = 0
	c.BackgroundColor3 = BLANCO
	esquinas(c, 2)
end
function ICONO.iconoExpandir(btn)
	local c = centrado(btn, 14, 8)
	linea(c, 9, 2.4, 45, UDim2.fromOffset(4, 4))
	linea(c, 9, 2.4, -45, UDim2.fromOffset(10, 4))
end

-- Visualizador
local function crearBarras(padre, n, x0, ancho, gap, abajo)
	local barras = {}
	for i = 1, n do
		local b = nuevo("Frame", {
			AnchorPoint = Vector2.new(0, 1),
			Position = UDim2.new(0, x0 + (i - 1) * (ancho + gap), 1, -abajo),
			Size = UDim2.new(0, ancho, 0.1, 0), BackgroundColor3 = BLANCO, BorderSizePixel = 0, ZIndex = 2,
		}, padre)
		esquinas(b, 2)
		nuevo("UIGradient", { Color = ColorSequence.new(ROSA, ACENTO), Rotation = 90 }, b)
		barras[i] = b
	end
	return barras
end
local function animar(barras, nivel, t, maxEsc, vivo)
	for i, b in ipairs(barras) do
		local hs
		if vivo then
			hs = math.clamp(0.1 + (vivo[i] or 0) * 0.9, 0.08, 1) -- espectro real
		else
			local onda = 0.5 + 0.5 * math.sin(t * (3 + i * 0.7) + i * 1.3)
			hs = math.clamp(0.12 + onda * nivel * 0.88, 0.08, 1) -- simulado
		end
		b.Size = UDim2.new(0, b.Size.X.Offset, hs * maxEsc, 0)
	end
end

-- Utilidades
local function nombre(ruta) return ruta:match("([^/\\]+)$") or ruta end
local function fmt(s)
	s = math.max(0, math.floor(s or 0))
	return string.format("%d:%02d", math.floor(s / 60), s % 60)
end
local function tocar(i)
	return i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch
end
local function mover(i)
	return i.UserInputType == Enum.UserInputType.MouseMovement or i.UserInputType == Enum.UserInputType.Touch
end
local function formatoAudio(s)
	if s:sub(1, 4) == "OggS" then return "ogg" end
	if s:sub(1, 3) == "ID3" then return "mp3" end
	local b1, b2 = s:byte(1, 2)
	if b1 == 255 and b2 and b2 >= 224 then return "mp3" end
	return nil
end

-- Índice de canciones descargadas (título y artista)
local indice = {}
if isfile(INDICE) then
	local ok, d = pcall(function() return HttpService:JSONDecode(readfile(INDICE)) end)
	if ok and type(d) == "table" then indice = d end
end
local function guardarIndice()
	pcall(function() writefile(INDICE, HttpService:JSONEncode(indice)) end)
end

-- Estado
local lista, actual, token = {}, 0, 0
local itemActual = nil
local modo = "local"
local localCache = {}
local busquedaId = 0
local aleatorio, pausado = (AJ.alea == 1), false
local repetir = (AJ.rep == 1 and "todo") or (AJ.rep == 2 and "uno") or "no"
local historial = {} -- canciones ya reproducidas en modo aleatorio (para que "atrás" vuelva a la anterior)
local reproducir, siguiente, anterior, alternar, buscar, pintarLista, mostrar, entrarModo, mostrarLogin, actualizarProx

-- Sonido
local sonido = Instance.new("Sound")
sonido.Name = "DeltaMusicaSound"
sonido.Volume = AJ.vol
sonido.Parent = SoundService

-- Sonido de clic: se genera un .wav propio (un "tic" corto). Si tu cliente no lo reproduce, se prueban
-- sonidos que trae el propio Roblox. Si ninguno carga, los clics quedan en silencio sin molestar.
do
	local function generarWav()
		local tasa, dur = 22050, 0.07
		local partes = {}
		for i = 0, math.floor(tasa * dur) - 1 do
			local t = i / tasa
			local env = math.exp(-t * 55) * math.min(1, t * 900)
			local v = (math.sin(2 * math.pi * 1300 * t) * 0.6 + math.sin(2 * math.pi * 2000 * t) * 0.4) * env
			partes[#partes + 1] = string.pack("<i2", math.floor(math.clamp(v, -1, 1) * 22000))
		end
		local datos = table.concat(partes)
		return "RIFF" .. string.pack("<I4", 36 + #datos) .. "WAVEfmt " .. string.pack("<I4I2I2I4I4I2I2", 16, 1, 1, tasa, tasa * 2, 2, 16)
			.. "data" .. string.pack("<I4", #datos) .. datos
	end
	task.spawn(function()
		local candidatos = {}
		pcall(function()
			local ruta = CARPETA .. "/clic_v1.wav"
			if not isfile(ruta) then writefile(ruta, generarWav()) end
			table.insert(candidatos, getcustomasset(ruta))
		end)
		for _, id in ipairs({ "rbxasset://sounds/button.wav", "rbxasset://sounds/switch.wav", "rbxasset://sounds/clickfast.wav" }) do
			table.insert(candidatos, id)
		end
		for _, id in ipairs(candidatos) do
			clicSnd.SoundId = id
			local t0 = os.clock()
			while not clicSnd.IsLoaded and os.clock() - t0 < 1.5 do task.wait(0.05) end
			if clicSnd.IsLoaded and clicSnd.TimeLength > 0 then CLIC.listo = true; return end
		end
	end)
end

-- Visualizador real: un AudioPlayer "espejo" (silenciado con un AudioFader a 0) alimenta un
-- AudioAnalyzer y se mantiene sincronizado con el Sound. Si el cliente no soporta esas clases,
-- o no llegan datos, AN.pl queda en nil / sin datos y se usan las ondas simuladas.
local AN = { suave = {}, pico = 1e-4, ultimo = 0, t = 0, ajuste = 0 }
do
	local ok = pcall(function()
		local pl = Instance.new("AudioPlayer")
		pl.Name = "Espejo"
		local an = Instance.new("AudioAnalyzer")
		an.Name = "Analizador"
		local fad = Instance.new("AudioFader")
		fad.Volume = 0
		local sal = Instance.new("AudioDeviceOutput")
		pl.Parent, an.Parent, fad.Parent, sal.Parent = sonido, sonido, sonido, sonido
		pcall(function() an.SpectrumEnabled = true end)
		local function cable(a, b)
			local w = Instance.new("Wire")
			w.SourceInstance, w.TargetInstance = a, b
			w.Parent = sonido
		end
		cable(pl, an)
		cable(pl, fad)
		cable(fad, sal)
		AN.pl, AN.an = pl, an
	end)
	if not ok then AN.pl, AN.an = nil, nil end

	local function sincronizar()
		local pl = AN.pl
		if sonido.IsPlaying then
			if AN.asset ~= sonido.SoundId then
				AN.asset = sonido.SoundId
				pl.Asset = sonido.SoundId
				AN.ultimo = 0 -- no confiar en datos de la canción anterior
			end
			local pos = sonido.TimePosition
			if not pl.IsPlaying then
				pl.TimePosition = pos
				pl:Play()
			elseif os.clock() - AN.ajuste > 0.5 and math.abs(pl.TimePosition - pos) > 0.3 then
				AN.ajuste = os.clock()
				pl.TimePosition = pos
			end
		elseif pl.IsPlaying then
			pl:Stop()
		end
	end
	AN.sinc = function()
		if AN.pl then pcall(sincronizar) end
	end

	-- Devuelve n niveles (0 a 1) del espectro real, o nil si no hay datos recientes
	AN.bandas = function(n, tocando)
		local an = AN.an
		if not an or not tocando then return nil end
		local t = os.clock()
		local suave = AN.suave[n]
		if not suave then
			suave = {}
			for i = 1, n do suave[i] = 0 end
			AN.suave[n] = suave
		end
		if t - AN.t >= 0.033 then -- ~30 lecturas por segundo
			AN.t = t
			local ok2, esp = pcall(function() return an:GetSpectrum() end)
			if ok2 and type(esp) == "table" and #esp >= 8 then
				local lo, hi = 2, math.max(6, math.floor(#esp * 0.45)) -- graves a agudos musicales
				local valores, maxv = {}, 0
				for i = 1, n do
					local a = math.floor(lo * (hi / lo) ^ ((i - 1) / n) + 0.5)
					local b = math.max(a, math.floor(lo * (hi / lo) ^ (i / n) + 0.5))
					local suma, c = 0, 0
					for k = a, b do
						suma = suma + (tonumber(esp[k]) or 0)
						c = c + 1
					end
					local v = suma / math.max(c, 1)
					valores[i] = v
					if v > maxv then maxv = v end
				end
				if maxv > 1e-6 then AN.ultimo = t end
				AN.pico = math.max(AN.pico * 0.985, maxv, 1e-6) -- ganancia automática
				for i = 1, n do
					local objetivo = (valores[i] / AN.pico) ^ 0.7
					suave[i] = suave[i] + (objetivo - suave[i]) * (objetivo > suave[i] and 0.6 or 0.15)
				end
			end
		end
		if t - AN.ultimo > 1 then return nil end
		return suave
	end
end

-- ================= Ventana expandida =================
local camara = workspace.CurrentCamera
local function altoVentana() return AJ.info == 1 and 404 or 356 end -- con pie (jugador/juego) o sin él
local function escala()
	local vp = camara and camara.ViewportSize or Vector2.new(844, 390)
	local alto = (vp.Y - 28) / (altoVentana() + 17) -- lo que cabe por alto (ventana + margen 17)
	local ancho = (vp.X - 20) / 360 -- lo que cabe por ancho
	return math.max(math.min(alto, ancho, 1.2) * TAM, 0.4)
end

local ventana = nuevo("Frame", {
	Name = "Ventana", AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 17),
	Size = UDim2.fromOffset(360, altoVentana()), BackgroundColor3 = PANEL, BackgroundTransparency = OPAC, BorderSizePixel = 0,
}, gui)
esquinas(ventana, 18)
local trazoVentana = nuevo("UIStroke", { Color = ACENTO, Thickness = 1.5, Transparency = 0.15 }, ventana)
-- degradado suave de arriba hacia abajo (multiplica el color del panel, por eso va de blanco a gris)
nuevo("UIGradient", { Color = ColorSequence.new(Color3.new(1, 1, 1), Color3.new(0.62, 0.58, 0.72)), Rotation = 90 }, ventana)
local escalaVentana = nuevo("UIScale", { Scale = escala() }, ventana)
local cont = nuevo("Frame", { Position = UDim2.fromOffset(10, 10), Size = UDim2.fromOffset(340, 384), BackgroundTransparency = 1 }, ventana)

-- Contenedor del reproductor y pantalla de entrada (van debajo de la barra de título)
local principal = nuevo("Frame", { Size = UDim2.fromOffset(340, 336), BackgroundTransparency = 1, BorderSizePixel = 0 }, cont)
local pantalla = nuevo("Frame", { Position = UDim2.fromOffset(0, 46), Size = UDim2.fromOffset(340, 290), BackgroundTransparency = 1, BorderSizePixel = 0, Visible = false }, cont)
local ajustes = nuevo("Frame", { Position = UDim2.fromOffset(0, 46), Size = UDim2.fromOffset(340, 290), BackgroundTransparency = 1, BorderSizePixel = 0, Visible = false }, cont)
local aplicarAjuste

-- Barra de título (se arrastra desde aquí)
local mango = boton(cont, { Size = UDim2.fromOffset(196, 40) })
for c = 0, 1 do
	for r = 0, 2 do
		local p = nuevo("Frame", {
			Size = UDim2.fromOffset(3, 3), Position = UDim2.fromOffset(6 + c * 6, 11 + r * 7),
			BackgroundColor3 = BLANCO, BackgroundTransparency = 0.55, BorderSizePixel = 0,
		}, mango)
		esquinas(p, 2)
	end
end
texto(mango, { Text = "Ultra Music", Font = Enum.Font.GothamBold, TextSize = 14, Size = UDim2.fromOffset(168, 40), Position = UDim2.fromOffset(26, 0) })
local bMin = boton(cont, { Size = UDim2.fromOffset(40, 40), Position = UDim2.fromOffset(252, 0), BackgroundColor3 = BLANCO, BackgroundTransparency = 0.92 })
esquinas(bMin, 12)
ICONO.iconoMinimizar(bMin)
local bCerrar = boton(cont, { Size = UDim2.fromOffset(40, 40), Position = UDim2.fromOffset(300, 0), BackgroundColor3 = Color3.fromRGB(255, 90, 120), BackgroundTransparency = 0.76 })
esquinas(bCerrar, 12)
ICONO.iconoCerrar(bCerrar)
local bAjustes = boton(cont, { Size = UDim2.fromOffset(40, 40), Position = UDim2.fromOffset(204, 0), BackgroundColor3 = BLANCO, BackgroundTransparency = 0.92 })
esquinas(bAjustes, 12)
do -- icono de ajustes: tres controles deslizantes
	local c = centrado(bAjustes, 16, 14)
	for k, x in ipairs({ 11, 4, 8 }) do
		local y = (k - 1) * 6 + 1
		linea(c, 16, 2, 0, UDim2.fromOffset(8, y))
		local p = nuevo("Frame", { Size = UDim2.fromOffset(5, 5), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromOffset(x, y), BackgroundColor3 = ROSA, BorderSizePixel = 0 }, c)
		esquinas(p, 3)
	end
end

-- ================= Pestañas: Reproductor / Buscar =================
local tabActual = "buscar"
local irTab
local tabPlayer =nuevo("CanvasGroup", { Name = "TabReproductor", Position = UDim2.fromOffset(0, 84), Size = UDim2.fromOffset(340, 252), BackgroundTransparency = 1, BorderSizePixel = 0, Visible = false }, principal)
local tabBuscar = nuevo("CanvasGroup", { Name = "TabBuscar", Position = UDim2.fromOffset(0, 84), Size = UDim2.fromOffset(340, 252), BackgroundTransparency = 1, BorderSizePixel = 0 }, principal)

-- ===== Reproductor: portada y visualizador, título, volumen, progreso y controles, todo junto =====
local tile = nuevo("Frame", { Size = UDim2.fromOffset(100, 100), BackgroundColor3 = FONDO_LISTA, BackgroundTransparency = 0.55, BorderSizePixel = 0 }, tabPlayer)
esquinas(tile, 14)
local trazoTile = nuevo("UIStroke", { Color = ACENTO, Thickness = 1, Transparency = 0.6 }, tile)
local barrasV = crearBarras(tile, 10, 8, (84 - 9 * 3) / 10, 3, 10)
local portadaImg = nuevo("ImageLabel", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, BorderSizePixel = 0, Image = "", ImageTransparency = 0.4, ScaleType = Enum.ScaleType.Crop, Visible = false, ZIndex = 1 }, tile)
esquinas(portadaImg, 14)
local tituloLbl = texto(tabPlayer, { Text = "Ultra Music", Font = Enum.Font.GothamBold, TextSize = 15, Size = UDim2.fromOffset(228, 22), Position = UDim2.fromOffset(112, 6), TextTruncate = Enum.TextTruncate.AtEnd })
local subLbl = texto(tabPlayer, { Text = "", TextSize = 11, TextColor3 = TEXTO2, TextTransparency = 0.15, Size = UDim2.fromOffset(228, 16), Position = UDim2.fromOffset(112, 30), TextTruncate = Enum.TextTruncate.AtEnd })

-- Progreso
local tActual = texto(tabPlayer, { Text = "0:00", TextSize = 11, TextColor3 = TEXTO2, Size = UDim2.fromOffset(34, 24), Position = UDim2.fromOffset(0, 110) })
local tTotal = texto(tabPlayer, { Text = "0:00", TextSize = 11, TextColor3 = TEXTO2, TextXAlignment = Enum.TextXAlignment.Right, Size = UDim2.fromOffset(34, 24), Position = UDim2.fromOffset(306, 110) })
local areaProg = boton(tabPlayer, { Size = UDim2.fromOffset(264, 24), Position = UDim2.fromOffset(38, 110) })
areaProg:SetAttribute("sinfx", true)
local pista = nuevo("Frame", { Size = UDim2.new(1, 0, 0, 6), Position = UDim2.new(0, 0, 0.5, -3), BackgroundColor3 = BLANCO, BackgroundTransparency = 0.82, BorderSizePixel = 0 }, areaProg)
esquinas(pista, 3)
local relleno = nuevo("Frame", { Size = UDim2.new(0, 0, 1, 0), BackgroundColor3 = BLANCO, BorderSizePixel = 0 }, pista)
esquinas(relleno, 3)
degradado(relleno)
local perilla = nuevo("Frame", { Size = UDim2.fromOffset(14, 14), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0, 0, 0.5, 0), BackgroundColor3 = BLANCO, BorderSizePixel = 0 }, areaProg)
esquinas(perilla, 7)
nuevo("UIStroke", { Color = ACENTO, Thickness = 2, Transparency = 0.4 }, perilla)

-- Volumen: 0 a VOL_MAX (el altavoz silencia / restaura)
do
	local volFila = nuevo("Frame", { Position = UDim2.fromOffset(112, 62), Size = UDim2.fromOffset(228, 24), BackgroundTransparency = 1, BorderSizePixel = 0 }, tabPlayer)
	local bMute = boton(volFila, { Size = UDim2.fromOffset(24, 24) })
	local ic = centrado(bMute, 18, 14)
	nuevo("Frame", { Size = UDim2.fromOffset(4, 6), Position = UDim2.fromOffset(0, 4), BackgroundColor3 = BLANCO, BorderSizePixel = 0 }, ic)
	triangulo(ic, 5, 10, BLANCO, true).Position = UDim2.fromOffset(4, 2)
	local onda = nuevo("Frame", { Size = UDim2.fromOffset(2, 8), Position = UDim2.fromOffset(12, 3), BackgroundColor3 = BLANCO, BorderSizePixel = 0 }, ic)
	esquinas(onda, 1)
	local tacha = linea(ic, 20, 2, 45)

	local areaVol = boton(volFila, { Size = UDim2.fromOffset(160, 24), Position = UDim2.fromOffset(28, 0) })
	areaVol:SetAttribute("sinfx", true)
	local pistaV = nuevo("Frame", { Size = UDim2.new(1, 0, 0, 4), Position = UDim2.new(0, 0, 0.5, -2), BackgroundColor3 = BLANCO, BackgroundTransparency = 0.82, BorderSizePixel = 0 }, areaVol)
	esquinas(pistaV, 2)
	local rellenoV = nuevo("Frame", { Size = UDim2.new(0, 0, 1, 0), BackgroundColor3 = BLANCO, BorderSizePixel = 0 }, pistaV)
	esquinas(rellenoV, 2)
	degradado(rellenoV)
	-- marca del 100%: a partir de ahí el volumen amplifica
	nuevo("Frame", { Size = UDim2.fromOffset(2, 8), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(1 / VOL_MAX, 0, 0.5, 0), BackgroundColor3 = BLANCO, BackgroundTransparency = 0.5, BorderSizePixel = 0 }, pistaV)
	local perillaV = nuevo("Frame", { Size = UDim2.fromOffset(12, 12), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0, 0, 0.5, 0), BackgroundColor3 = BLANCO, BorderSizePixel = 0 }, areaVol)
	esquinas(perillaV, 6)
	nuevo("UIStroke", { Color = ACENTO, Thickness = 2, Transparency = 0.4 }, perillaV)
	local pct = texto(volFila, { Text = "", TextSize = 11, TextColor3 = TEXTO2, TextXAlignment = Enum.TextXAlignment.Right, Size = UDim2.fromOffset(36, 24), Position = UDim2.fromOffset(192, 0) })

	local antes = AJ.vol > 0 and AJ.vol or 0.8
	local function mostrarVol()
		local v = sonido.Volume
		local f = math.clamp(v / VOL_MAX, 0, 1)
		rellenoV.Size = UDim2.new(f, 0, 1, 0)
		perillaV.Position = UDim2.new(f, 0, 0.5, 0)
		pct.Text = math.floor(v * 100 + 0.5) .. "%"
		pct.TextColor3 = v > 1 and ROSA or TEXTO2
		onda.Visible = v > 0
		tacha.Visible = v <= 0
	end
	local function ponerVol(v)
		v = math.clamp(v, 0, VOL_MAX)
		sonido.Volume = v
		AJ.vol = v
		if v > 0 then antes = v end
		mostrarVol()
	end
	local function desdeX(x)
		local ancho = pistaV.AbsoluteSize.X
		if ancho <= 0 then return end
		local f = math.clamp((x - pistaV.AbsolutePosition.X) / ancho, 0, 1)
		local v = math.floor(f * VOL_MAX * 20 + 0.5) / 20 -- pasos de 5%
		if math.abs(v - 1) < 0.04 then v = 1 end -- imán al 100%
		ponerVol(v)
	end

	local moviendo = false
	areaVol.InputBegan:Connect(function(i)
		if tocar(i) then moviendo = true; desdeX(i.Position.X) end
	end)
	conectar(UIS.InputChanged, function(i)
		if moviendo and mover(i) then desdeX(i.Position.X) end
	end)
	conectar(UIS.InputEnded, function(i)
		if moviendo and tocar(i) then moviendo = false; guardarConfig() end
	end)
	bMute.MouseButton1Click:Connect(function()
		ponerVol(sonido.Volume > 0 and 0 or antes)
		guardarConfig()
	end)
	mostrarVol()
end

-- Controles
local iconosPlay, iconosPausa = {}, {}
local strokesPlay = {}
local function crearPlay(padre, tam, pos)
	local b = boton(padre, { Size = UDim2.fromOffset(tam, tam), Position = pos, BackgroundColor3 = BLANCO, BackgroundTransparency = 0 })
	esquinas(b, tam / 2)
	degradado(b)
	table.insert(strokesPlay, nuevo("UIStroke", { Color = ACENTO, Thickness = 1.5, Transparency = 0.6 }, b))
	local ip = ICONO.iconoPlay(b)
	local ipa = ICONO.iconoPausa(b)
	ipa.Visible = false
	table.insert(iconosPlay, ip)
	table.insert(iconosPausa, ipa)
	b.MouseButton1Click:Connect(function() alternar() end)
	return b
end
local function botonSalto(padre, tam, pos, hacia, f)
	local b = boton(padre, { Size = UDim2.fromOffset(tam, tam), Position = pos })
	ICONO.iconoSalto(b, hacia)
	b.MouseButton1Click:Connect(f)
	return b
end

do
local ctl = nuevo("Frame", { Position = UDim2.fromOffset(0, 142), Size = UDim2.fromOffset(340, 48), BackgroundTransparency = 1, BorderSizePixel = 0 }, tabPlayer)
local bAle = boton(ctl, { Size = UDim2.fromOffset(44, 44), Position = UDim2.fromOffset(4, 2), BackgroundColor3 = ACENTO })
esquinas(bAle, 14)
local stAle = nuevo("UIStroke", { Color = BLANCO, Thickness = 1 }, bAle)
local icAle = ICONO.iconoAleatorio(bAle)
botonSalto(ctl, 44, UDim2.fromOffset(75, 2), "ant", function() anterior() end)
crearPlay(ctl, 48, UDim2.fromOffset(146, 0))
botonSalto(ctl, 44, UDim2.fromOffset(221, 2), "sig", function() siguiente(false) end)
local bRep = boton(ctl, { Size = UDim2.fromOffset(44, 44), Position = UDim2.fromOffset(292, 2), BackgroundColor3 = ACENTO })
esquinas(bRep, 14)
local stRep = nuevo("UIStroke", { Color = BLANCO, Thickness = 1 }, bRep)
local icRep = ICONO.iconoRepetir(bRep)
local lblUno = texto(bRep, { Text = "1", Font = Enum.Font.GothamBold, TextSize = 10, TextXAlignment = Enum.TextXAlignment.Center, Size = UDim2.fromScale(1, 1), Visible = false })

local function refrescarToggles()
	local function estilo(b, st, ic, on)
		b.BackgroundTransparency = on and 0.72 or 1
		st.Color = on and ACENTO or BLANCO
		st.Transparency = on and 0.15 or 0.86
		ic.GroupTransparency = on and 0 or 0.35
	end
	estilo(bAle, stAle, icAle, aleatorio)
	estilo(bRep, stRep, icRep, repetir ~= "no")
	lblUno.Visible = (repetir == "uno")
end
bAle.MouseButton1Click:Connect(function()
	aleatorio = not aleatorio
	if not aleatorio then historial = {} end
	AJ.alea = aleatorio and 1 or 0
	guardarConfig()
	refrescarToggles()
	actualizarProx()
end)
bRep.MouseButton1Click:Connect(function()
	repetir = (repetir == "no" and "todo") or (repetir == "todo" and "uno") or "no"
	AJ.rep = (repetir == "todo" and 1) or (repetir == "uno" and 2) or 0
	guardarConfig()
	refrescarToggles()
	actualizarProx()
end)
refrescarToggles()
end

-- Siguiente canción
local proxLbl
do
	local proxFila = nuevo("Frame", { Position = UDim2.fromOffset(0, 198), Size = UDim2.fromOffset(340, 38), BackgroundColor3 = FONDO_LISTA, BackgroundTransparency = 0.6, BorderSizePixel = 0 }, tabPlayer)
	esquinas(proxFila, 14)
	nuevo("UIStroke", { Color = BLANCO, Thickness = 1, Transparency = 0.86 }, proxFila)
	texto(proxFila, { Text = T("siguiente_lbl"), Font = Enum.Font.GothamBold, TextSize = 9, TextColor3 = ROSA, Size = UDim2.fromOffset(70, 38), Position = UDim2.fromOffset(14, 0) })
	proxLbl = texto(proxFila, { Text = "—", TextSize = 12, Size = UDim2.fromOffset(240, 38), Position = UDim2.fromOffset(86, 0), TextTruncate = Enum.TextTruncate.AtEnd })
end

-- ===== Buscar: fuente, búsqueda y resultados, con un mini reproductor abajo =====
local fondoBusca = nuevo("Frame", { Size = UDim2.fromOffset(340, 36), BackgroundColor3 = FONDO_LISTA, BackgroundTransparency = 0.6, BorderSizePixel = 0 }, tabBuscar)
esquinas(fondoBusca, 18)
nuevo("UIStroke", { Color = BLANCO, Thickness = 1, Transparency = 0.86 }, fondoBusca)
local caja = nuevo("TextBox", {
	Position = UDim2.fromOffset(14, 0), Size = UDim2.fromOffset(232, 36), BackgroundTransparency = 1,
	Text = "", PlaceholderText = T("tab_buscar"), PlaceholderColor3 = Color3.fromRGB(180, 165, 205),
	TextColor3 = BLANCO, Font = Enum.Font.GothamMedium, TextSize = 12, TextXAlignment = Enum.TextXAlignment.Left,
	ClearTextOnFocus = false,
}, fondoBusca)
local bModo = boton(fondoBusca, {
	Position = UDim2.fromOffset(254, 4), Size = UDim2.fromOffset(82, 28), BackgroundColor3 = ACENTO, BackgroundTransparency = 0.5,
	Text = T("modo_local"), Font = Enum.Font.GothamBold, TextSize = 11, TextColor3 = BLANCO,
})
esquinas(bModo, 14)
local estadoLbl = texto(tabBuscar, { Text = "", TextSize = 11, TextColor3 = TEXTO2, TextTransparency = 0.15, Size = UDim2.fromOffset(332, 16), Position = UDim2.fromOffset(8, 40), TextTruncate = Enum.TextTruncate.AtEnd })

-- Lista (dentro de un CanvasGroup para poder desvanecerla al cargar resultados nuevos)
local listaMarco = nuevo("CanvasGroup", { Position = UDim2.fromOffset(0, 60), Size = UDim2.fromOffset(340, 140), BackgroundTransparency = 1, BorderSizePixel = 0 }, tabBuscar)
local listaUI = nuevo("ScrollingFrame", {
	Size = UDim2.fromScale(1, 1),
	BackgroundColor3 = FONDO_LISTA, BackgroundTransparency = 0.6, BorderSizePixel = 0,
	ScrollBarThickness = 3, ScrollBarImageColor3 = BLANCO, ScrollBarImageTransparency = 0.7,
	CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y,
}, listaMarco)
esquinas(listaUI, 12)
nuevo("UIListLayout", { Padding = UDim.new(0, 2), SortOrder = Enum.SortOrder.LayoutOrder }, listaUI)
nuevo("UIPadding", { PaddingTop = UDim.new(0, 4), PaddingBottom = UDim.new(0, 4), PaddingLeft = UDim.new(0, 4), PaddingRight = UDim.new(0, 4) }, listaUI)
local function fundirLista()
	listaMarco.GroupTransparency = 0.8
	tween(listaMarco, 0.3, { GroupTransparency = 0 })
end

-- Mini reproductor: sigue a mano mientras buscas (toca el título para abrir el reproductor)
local stripTitulo, stripSub
do
	local strip = nuevo("Frame", { Position = UDim2.fromOffset(0, 206), Size = UDim2.fromOffset(340, 46), BackgroundColor3 = FONDO_LISTA, BackgroundTransparency = 0.45, BorderSizePixel = 0 }, tabBuscar)
	esquinas(strip, 14)
	nuevo("UIStroke", { Color = ACENTO, Thickness = 1, Transparency = 0.6 }, strip)
	local stripAsa = boton(strip, { Size = UDim2.fromOffset(228, 46) })
	stripAsa:SetAttribute("sinfx", true)
	stripAsa.MouseButton1Click:Connect(function() clic(1.3); irTab("player") end)
	stripTitulo = texto(strip, { Text = "Ultra Music", Font = Enum.Font.GothamBold, TextSize = 13, Size = UDim2.fromOffset(210, 18), Position = UDim2.fromOffset(14, 6), TextTruncate = Enum.TextTruncate.AtEnd })
	stripSub = texto(strip, { Text = T("toca_abrir"), TextSize = 10, TextColor3 = TEXTO2, Size = UDim2.fromOffset(210, 14), Position = UDim2.fromOffset(14, 25), TextTruncate = Enum.TextTruncate.AtEnd })
	crearPlay(strip, 36, UDim2.fromOffset(240, 5))
	botonSalto(strip, 34, UDim2.fromOffset(286, 6), "sig", function() siguiente(false) end)
end

-- Barra de pestañas: la píldora se desliza y el contenido entra con fundido
do
	local barraTabs = nuevo("Frame", { Position = UDim2.fromOffset(0, 46), Size = UDim2.fromOffset(340, 32), BackgroundColor3 = FONDO_LISTA, BackgroundTransparency = 0.6, BorderSizePixel = 0 }, principal)
	esquinas(barraTabs, 16)
	nuevo("UIStroke", { Color = BLANCO, Thickness = 1, Transparency = 0.86 }, barraTabs)
	local pildora = nuevo("Frame", { Position = UDim2.fromOffset(173, 3), Size = UDim2.fromOffset(164, 26), BackgroundColor3 = BLANCO, BorderSizePixel = 0 }, barraTabs)
	esquinas(pildora, 13)
	degradado(pildora)
	local function botonTab(txt, x)
		local b = boton(barraTabs, { Position = UDim2.fromOffset(x, 0), Size = UDim2.fromOffset(170, 32), Text = txt, Font = Enum.Font.GothamBold, TextSize = 12, TextColor3 = BLANCO, ZIndex = 2 })
		b:SetAttribute("tono", 1.3)
		return b
	end
	local bTabP, bTabB = botonTab(T("tab_player"), 0), botonTab(T("tab_buscar"), 170)

	irTab = function(nombre, sinAnim)
		if nombre == tabActual and not sinAnim then return end
		local haciaBuscar = (nombre == "buscar")
		tabActual = nombre
		local x = haciaBuscar and 173 or 3
		if sinAnim then
			pildora.Position = UDim2.fromOffset(x, 3)
		else
			tween(pildora, 0.3, { Position = UDim2.fromOffset(x, 3) }, Enum.EasingStyle.Back)
		end
		bTabP.TextColor3, bTabP.TextTransparency = haciaBuscar and TEXTO2 or BLANCO, haciaBuscar and 0.2 or 0
		bTabB.TextColor3, bTabB.TextTransparency = haciaBuscar and BLANCO or TEXTO2, haciaBuscar and 0 or 0.2
		local entra = haciaBuscar and tabBuscar or tabPlayer
		local sale = haciaBuscar and tabPlayer or tabBuscar
		sale.Visible = false
		entra.Visible = true
		if not sinAnim then
			entra.GroupTransparency = 1
			entra.Position = UDim2.fromOffset(haciaBuscar and 24 or -24, 84)
			tween(entra, 0.3, { GroupTransparency = 0, Position = UDim2.fromOffset(0, 84) })
		end
	end
	bTabP.MouseButton1Click:Connect(function() irTab("player") end)
	bTabB.MouseButton1Click:Connect(function() irTab("buscar") end)
end

-- ================= Pantalla de entrada =================
texto(pantalla, { Text = T("login_titulo"), Font = Enum.Font.GothamBold, TextSize = 16, Size = UDim2.fromOffset(340, 22) })
texto(pantalla, {
	Text = T("login_desc"),
	TextSize = 11, TextColor3 = TEXTO2, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top,
	Size = UDim2.fromOffset(340, 44), Position = UDim2.fromOffset(0, 26),
})
local fondoClave = nuevo("Frame", { Position = UDim2.fromOffset(0, 76), Size = UDim2.fromOffset(340, 38), BackgroundColor3 = FONDO_LISTA, BackgroundTransparency = 0.6, BorderSizePixel = 0 }, pantalla)
esquinas(fondoClave, 19)
nuevo("UIStroke", { Color = BLANCO, Thickness = 1, Transparency = 0.86 }, fondoClave)
local cajaClave = nuevo("TextBox", {
	Position = UDim2.fromOffset(14, 0), Size = UDim2.fromOffset(312, 38), BackgroundTransparency = 1,
	Text = "", PlaceholderText = T("login_ph"), PlaceholderColor3 = Color3.fromRGB(180, 165, 205),
	TextColor3 = BLANCO, Font = Enum.Font.GothamMedium, TextSize = 12, TextXAlignment = Enum.TextXAlignment.Left,
	ClearTextOnFocus = false,
}, fondoClave)
local loginEstado = texto(pantalla, { Text = "", TextSize = 11, TextColor3 = ROSA, Size = UDim2.fromOffset(340, 18), Position = UDim2.fromOffset(0, 120), TextTruncate = Enum.TextTruncate.AtEnd })
local bEntrar = boton(pantalla, {
	Size = UDim2.fromOffset(340, 40), Position = UDim2.fromOffset(0, 142), BackgroundColor3 = BLANCO, BackgroundTransparency = 0,
	Text = T("entrar"), Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = BLANCO,
})
esquinas(bEntrar, 20)
degradado(bEntrar)
local function botonSecundario(txt, x)
	local b = boton(pantalla, {
		Size = UDim2.fromOffset(164, 40), Position = UDim2.fromOffset(x, 190), BackgroundColor3 = ACENTO, BackgroundTransparency = 0.72,
		Text = txt, Font = Enum.Font.GothamBold, TextSize = 12, TextColor3 = BLANCO,
	})
	esquinas(b, 20)
	nuevo("UIStroke", { Color = ACENTO, Thickness = 1, Transparency = 0.3 }, b)
	return b
end
local bCopiar = botonSecundario(T("copiar_portal"), 0)
local bLocal = botonSecundario(T("musica_local"), 176)
texto(pantalla, {
	Text = T("login_sin_clave"),
	TextSize = 11, TextColor3 = TEXTO2, TextTransparency = 0.15, TextWrapped = true, TextYAlignment = Enum.TextYAlignment.Top,
	Size = UDim2.fromOffset(340, 44), Position = UDim2.fromOffset(0, 242),
})

-- ================= Pantalla de apariencia =================
local refrescarAjustes
do
	local swatches, grupos, chips = {}, {}, {}
	texto(ajustes, { Text = T("ajuste_tema"), Font = Enum.Font.GothamBold, Size = UDim2.fromOffset(120, 16) })
	local bReset = boton(ajustes, {
		Text = T("restablecer"), Font = Enum.Font.GothamMedium, TextSize = 11, TextColor3 = ROSA,
		TextXAlignment = Enum.TextXAlignment.Right, Size = UDim2.fromOffset(120, 16), Position = UDim2.fromOffset(220, 0),
	})
	bReset.MouseButton1Click:Connect(function() aplicarAjuste("reset") end)

	-- Muestras de tema (colores fijos: no se recolorean al cambiar de tema)
	for i, t in ipairs(TEMAS) do
		local col, fila = (i - 1) % 4, math.floor((i - 1) / 4)
		local b = boton(ajustes, { Size = UDim2.fromOffset(79, 30), Position = UDim2.fromOffset(col * 87, 18 + fila * 34) })
		esquinas(b, 10)
		local fondo = nuevo("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = BLANCO, BorderSizePixel = 0 }, b)
		fondo:SetAttribute("fijo", true)
		esquinas(fondo, 10)
		nuevo("UIGradient", { Color = ColorSequence.new(t.acento, t.rosa) }, fondo)
		texto(b, { Text = t.nombre, Font = Enum.Font.GothamBold, TextSize = 11, TextXAlignment = Enum.TextXAlignment.Center, Size = UDim2.fromScale(1, 1), TextStrokeTransparency = 0.6 })
		local st = nuevo("UIStroke", { Color = BLANCO, Thickness = 2, Transparency = 1 }, b)
		st:SetAttribute("fijo", true)
		swatches[i] = st
		b.MouseButton1Click:Connect(function() aplicarAjuste("tema", i) end)
	end

	-- Grupos de opciones (forma, tamaño, opacidad, compacto): etiqueta a la izquierda, botones a la derecha
	local function grupo(y, titulo, campo, opciones)
		texto(ajustes, { Text = titulo, Font = Enum.Font.GothamBold, Size = UDim2.fromOffset(74, 26), Position = UDim2.fromOffset(0, y) })
		local btns = {}
		local n = #opciones
		local ancho = (262 - 6 * (n - 1)) / n
		for i, op in ipairs(opciones) do
			local b = boton(ajustes, {
				Size = UDim2.fromOffset(ancho, 26), Position = UDim2.fromOffset(78 + (i - 1) * (ancho + 6), y),
				BackgroundColor3 = ACENTO, BackgroundTransparency = 1, Text = op[1], Font = Enum.Font.GothamMedium, TextSize = 12, TextColor3 = BLANCO,
			})
			esquinas(b, 9)
			local st = nuevo("UIStroke", { Color = ACENTO, Thickness = 1, Transparency = 0.7 }, b)
			b.MouseButton1Click:Connect(function() aplicarAjuste(campo, op[2]) end)
			btns[i] = { b = b, st = st, valor = op[2] }
		end
		table.insert(grupos, { campo = campo, btns = btns })
	end
	grupo(88, T("forma"), "forma", { { T("redondo"), 1 }, { T("suave"), 0.5 }, { T("recto"), 0 } })
	grupo(122, T("tamano"), "tam", { { T("pequeno"), 0.7 }, { T("medio"), 0.85 }, { T("maximo"), 1 } })
	grupo(156, T("opacidad"), "opac", { { T("cristal"), 0.35 }, { T("medio"), 0.15 }, { T("solido"), 0 } })
	grupo(190, T("compacto"), "compacto", { { T("barra"), 1 }, { T("circular"), 2 } })

	-- Efectos: interruptores de sonido y animaciones
	local function chip(x, campo, nombre)
		local b = boton(ajustes, {
			Size = UDim2.fromOffset(110, 26), Position = UDim2.fromOffset(x, 226),
			BackgroundColor3 = ACENTO, BackgroundTransparency = 1, Text = nombre, Font = Enum.Font.GothamMedium, TextSize = 11, TextColor3 = BLANCO,
		})
		esquinas(b, 9)
		local st = nuevo("UIStroke", { Color = ACENTO, Thickness = 1, Transparency = 0.7 }, b)
		b.MouseButton1Click:Connect(function() aplicarAjuste(campo, AJ[campo] == 1 and 0 or 1) end)
		table.insert(chips, { b = b, st = st, campo = campo, nombre = nombre })
	end
	chip(0, "sonidos", T("sonidos"))
	chip(115, "anim", T("animaciones"))
	chip(230, "info", T("info"))

	refrescarAjustes = function()
		for i, st in ipairs(swatches) do st.Transparency = (i == AJ.tema) and 0 or 1 end
		for _, g in ipairs(grupos) do
			for _, it in ipairs(g.btns) do
				local on = math.abs(AJ[g.campo] - it.valor) < 0.001
				it.b.BackgroundColor3 = ACENTO
				it.b.BackgroundTransparency = on and 0.55 or 1
				it.st.Color = ACENTO
				it.st.Transparency = on and 0.1 or 0.7
			end
		end
		for _, c in ipairs(chips) do
			local on = AJ[c.campo] == 1
			c.b.Text = T("chip_estado", c.nombre, (on and T("si") or T("no")))
			c.b.BackgroundColor3 = ACENTO
			c.b.BackgroundTransparency = on and 0.55 or 1
			c.st.Color = ACENTO
			c.st.Transparency = on and 0.1 or 0.7
		end
	end

	local bListo = boton(ajustes, {
		Size = UDim2.fromOffset(340, 24), Position = UDim2.fromOffset(0, 262), BackgroundColor3 = ACENTO, BackgroundTransparency = 0.72,
		Text = T("listo"), Font = Enum.Font.GothamBold, TextSize = 12, TextColor3 = BLANCO,
	})
	esquinas(bListo, 12)
	nuevo("UIStroke", { Color = ACENTO, Thickness = 1, Transparency = 0.3 }, bListo)

	-- Abrir / cerrar desde el engranaje
	local previa = "principal"
	local function cerrar()
		ajustes.Visible = false
		if previa == "login" then pantalla.Visible = true else principal.Visible = true end
	end
	bListo.MouseButton1Click:Connect(cerrar)
	bAjustes.MouseButton1Click:Connect(function()
		if ajustes.Visible then cerrar(); return end
		previa = pantalla.Visible and "login" or "principal"
		principal.Visible = false
		pantalla.Visible = false
		ajustes.Visible = true
		refrescarAjustes()
	end)
end

-- ================= Pie: jugador, avatar y juego (tocar un dato lo copia) =================
local aplicarInfo
do
	local pie = nuevo("Frame", { Name = "Pie", Position = UDim2.fromOffset(0, 340), Size = UDim2.fromOffset(340, 44), BackgroundColor3 = FONDO_LISTA, BackgroundTransparency = 0.6, BorderSizePixel = 0, Visible = (AJ.info == 1) }, cont)
	esquinas(pie, 14)
	nuevo("UIStroke", { Color = BLANCO, Thickness = 1, Transparency = 0.86 }, pie)

	-- Avatar (retrato del jugador). Si el cliente no lo carga a tiempo, se pide con GetUserThumbnailAsync.
	local avatar = nuevo("ImageLabel", {
		Position = UDim2.fromOffset(8, 6), Size = UDim2.fromOffset(32, 32), BackgroundColor3 = ACENTO, BackgroundTransparency = 0.6, BorderSizePixel = 0,
		Image = "rbxthumb://type=AvatarHeadShot&id=" .. tostring(lp.UserId) .. "&w=150&h=150",
	}, pie)
	nuevo("UICorner", { CornerRadius = UDim.new(0.5, 0) }, avatar)
	nuevo("UIStroke", { Color = ACENTO, Thickness = 1.5, Transparency = 0.3 }, avatar)
	task.delay(4, function()
		if avatar.Parent and not avatar.IsLoaded then
			pcall(function()
				avatar.Image = Players:GetUserThumbnailAsync(lp.UserId, Enum.ThumbnailType.HeadShot, Enum.ThumbnailSize.Size100x100)
			end)
		end
	end)

	local function etiqueta(x, w, y, txt, tam, negrita, color)
		return texto(pie, {
			Text = txt, Font = negrita and Enum.Font.GothamBold or Enum.Font.GothamMedium, TextSize = tam, TextColor3 = color or BLANCO,
			Size = UDim2.fromOffset(w, tam + 6), Position = UDim2.fromOffset(x, y), TextTruncate = Enum.TextTruncate.AtEnd,
		})
	end

	-- Nombre del juego en INGLÉS: la API pública de Roblox responde en el idioma que pidamos (Accept-Language);
	-- si falla, MarketplaceService y, por último, game.Name (que puede venir traducido).
	local function nombreJuegoIngles()
		local universo = game.GameId
		if req and universo and universo ~= 0 then
			local ok, res = pcall(req, {
				Url = "https://games.roblox.com/v1/games?universeIds=" .. tostring(universo), Method = "GET",
				Headers = { ["Accept-Language"] = "en-US,en;q=0.9" },
			})
			if ok and res and res.StatusCode == 200 then
				local okJ, d = pcall(function() return HttpService:JSONDecode(res.Body) end)
				local g = okJ and type(d) == "table" and type(d.data) == "table" and d.data[1]
				if type(g) == "table" then
					if type(g.name) == "string" and g.name ~= "" then return g.name end
					if type(g.sourceName) == "string" and g.sourceName ~= "" then return g.sourceName end
				end
			end
		end
		local ok, info = pcall(function() return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId) end)
		if ok and type(info) == "table" and type(info.Name) == "string" and info.Name ~= "" then return info.Name end
		return nil
	end

	local juegoNombre = game.Name
	local placeId = tostring(game.PlaceId)
	local nombreLbl = etiqueta(48, 110, 4, lp.DisplayName, 12, true)
	local userLbl = etiqueta(48, 110, 22, "@" .. lp.Name, 10, false, TEXTO2)
	nuevo("Frame", { Position = UDim2.fromOffset(164, 8), Size = UDim2.fromOffset(1, 28), BackgroundColor3 = BLANCO, BackgroundTransparency = 0.85, BorderSizePixel = 0 }, pie)
	local juegoLbl = etiqueta(174, 158, 4, juegoNombre, 12, true)
	local idLbl = etiqueta(174, 158, 22, T("id_juego", placeId), 10, false, TEXTO2)

	-- Tocar una línea la copia al portapapeles (PC y celular, con el setclipboard del executor)
	local function copiable(lbl, valor, normal)
		local btn = boton(pie, { Size = lbl.Size, Position = lbl.Position, ZIndex = 3 })
		btn:SetAttribute("sinfx", true)
		local n = 0
		btn.MouseButton1Click:Connect(function()
			clic(1.1)
			n = n + 1
			local mio = n
			local f = (type(setclipboard) == "function" and setclipboard) or (type(toclipboard) == "function" and toclipboard) or nil
			local ok = f ~= nil and pcall(f, tostring(valor()))
			lbl.Text = ok and T("copiado") or T("no_copiar")
			task.delay(1.2, function()
				if mio == n then lbl.Text = normal() end
			end)
		end)
	end
	copiable(nombreLbl, function() return lp.DisplayName end, function() return lp.DisplayName end)
	copiable(userLbl, function() return lp.Name end, function() return "@" .. lp.Name end)
	copiable(juegoLbl, function() return juegoNombre end, function() return juegoNombre end)
	copiable(idLbl, function() return placeId end, function() return T("id_juego", placeId) end)

	task.spawn(function()
		local n = nombreJuegoIngles()
		if n then
			juegoNombre = n
			if pie.Parent then juegoLbl.Text = n end
		end
	end)

	-- Mostrar / ocultar el pie (ajuste "Info"): la ventana crece o se encoge y se reescala
	aplicarInfo = function()
		pie.Visible = (AJ.info == 1)
		ventana.Size = UDim2.fromOffset(360, altoVentana())
		escalaVentana.Scale = escala()
	end
end

-- ================= Mini-barra =================
local mini = nuevo("Frame", {
	Name = "Mini", AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 14),
	Size = UDim2.fromOffset(400, 56), BackgroundColor3 = PANEL, BackgroundTransparency = OPAC, BorderSizePixel = 0, Visible = false,
}, gui)
esquinas(mini, 28)
local escalaMini = nuevo("UIScale", { Scale = math.min(TAM, ((camara and camara.ViewportSize.X or 844) - 20) / 400) }, mini)
local trazoMini = nuevo("UIStroke", { Color = ACENTO, Thickness = 1.5, Transparency = 0.15 }, mini)
local miniMango = boton(mini, { Position = UDim2.fromOffset(8, 8), Size = UDim2.fromOffset(40, 40), BackgroundColor3 = FONDO_LISTA, BackgroundTransparency = 0.55 })
esquinas(miniMango, 14)
nuevo("UIStroke", { Color = ACENTO, Thickness = 1, Transparency = 0.6 }, miniMango)
local barrasM = crearBarras(miniMango, 5, 6, 3.2, 3, 6)
local miniImg = nuevo("ImageLabel", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, BorderSizePixel = 0, Image = "", ImageTransparency = 0.4, ScaleType = Enum.ScaleType.Crop, Visible = false, ZIndex = 1 }, miniMango)
esquinas(miniImg, 14)
local miniTitulo = boton(mini, {
	Text = "Ultra Music", Font = Enum.Font.GothamBold, TextSize = 13, TextColor3 = BLANCO,
	TextXAlignment = Enum.TextXAlignment.Left, TextTruncate = Enum.TextTruncate.AtEnd,
	Position = UDim2.fromOffset(56, 9), Size = UDim2.fromOffset(140, 20),
})
local miniPista = nuevo("Frame", { Position = UDim2.fromOffset(56, 34), Size = UDim2.fromOffset(140, 4), BackgroundColor3 = BLANCO, BackgroundTransparency = 0.82, BorderSizePixel = 0 }, mini)
esquinas(miniPista, 2)
local miniRelleno = nuevo("Frame", { Size = UDim2.new(0, 0, 1, 0), BackgroundColor3 = BLANCO, BorderSizePixel = 0 }, miniPista)
esquinas(miniRelleno, 2)
degradado(miniRelleno)
botonSalto(mini, 40, UDim2.fromOffset(204, 8), "ant", function() anterior() end)
crearPlay(mini, 44, UDim2.fromOffset(252, 6))
botonSalto(mini, 40, UDim2.fromOffset(304, 8), "sig", function() siguiente(false) end)
local bExpandir = boton(mini, { Size = UDim2.fromOffset(40, 40), Position = UDim2.fromOffset(352, 8), BackgroundColor3 = BLANCO, BackgroundTransparency = 0.92 })
esquinas(bExpandir, 12)
ICONO.iconoExpandir(bExpandir)

-- ================= Burbuja =================
local burbuja = boton(gui, {
	Name = "Burbuja", AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 14),
	Size = UDim2.fromOffset(56, 56), BackgroundColor3 = PANEL, BackgroundTransparency = OPAC, Visible = false,
})
esquinas(burbuja, 28)
local escalaBurbuja = nuevo("UIScale", { Scale = TAM }, burbuja)
local trazoBurbuja = nuevo("UIStroke", { Color = ACENTO, Thickness = 1.5, Transparency = 0.15 }, burbuja)
-- portada de la canción, recortada en círculo (se oscurece un poco para que se vean las barras y el play)
local burbujaImg = nuevo("ImageLabel", {
	Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, BorderSizePixel = 0, Image = "", ImageTransparency = 0.1,
	ImageColor3 = Color3.fromRGB(150, 150, 150), ScaleType = Enum.ScaleType.Crop, Visible = false, ZIndex = 1,
}, burbuja)
esquinas(burbujaImg, 28)
local zonaB = centrado(burbuja, 20, 22) -- suena: barras animadas
local barrasB = crearBarras(zonaB, 3, 0, 4, 4, 0)
local iconoPlayB = ICONO.iconoPlay(burbuja) -- en pausa: triángulo de play

-- ================= Arrastrar =================
-- Al mover la ventana se "levanta" (crece un poco y el borde brilla), se inclina según la velocidad
-- y al soltarla vuelve a su sitio con un rebote.
local function escMini() return math.min(TAM, ((camara and camara.ViewportSize.X or 844) - 20) / 400) end
local function arrastrable(asa, objetivo, alTocar, esc, escFn, trazo, alMantener)
	asa:SetAttribute("sinfx", true)
	local arrastrando, inicio, posIni, movio, ultimaX = false, nil, nil, false, 0
	local mantenido, toque = false, 0 -- alMantener: se dispara si lo dejas pulsado 0.5 s sin moverlo
	local function levantar()
		if AJ.anim ~= 1 then return end
		if esc and escFn then tween(esc, 0.22, { Scale = escFn() * 1.04 }, Enum.EasingStyle.Back) end
		if trazo then tween(trazo, 0.2, { Thickness = 3, Transparency = 0 }) end
	end
	local function soltar()
		if esc and escFn then tween(esc, 0.45, { Scale = escFn() }, Enum.EasingStyle.Elastic) end
		if trazo then tween(trazo, 0.3, { Thickness = 1.5, Transparency = 0.15 }) end
		tween(objetivo, 0.5, { Rotation = 0 }, Enum.EasingStyle.Elastic)
	end
	asa.InputBegan:Connect(function(i)
		if tocar(i) then
			arrastrando, movio, mantenido = true, false, false
			toque = toque + 1
			local mio = toque
			inicio, posIni, ultimaX = i.Position, objetivo.Position, i.Position.X
			if alMantener then
				task.delay(0.5, function()
					if arrastrando and not movio and toque == mio then
						mantenido = true
						clic(0.8)
						alMantener()
					end
				end)
			end
			i.Changed:Connect(function()
				if i.UserInputState == Enum.UserInputState.End then
					arrastrando = false
					if mantenido then
						mantenido = false
					elseif movio then
						soltar()
					elseif alTocar then
						clic(1.2)
						alTocar()
					end
				end
			end)
		end
	end)
	conectar(UIS.InputChanged, function(i)
		if arrastrando and not mantenido and mover(i) then
			local d = i.Position - inicio
			if not movio and d.Magnitude > 8 then movio = true; levantar() end
			objetivo.Position = UDim2.new(posIni.X.Scale, posIni.X.Offset + d.X, posIni.Y.Scale, posIni.Y.Offset + d.Y)
			if movio and AJ.anim == 1 then
				local dx = i.Position.X - ultimaX
				objetivo.Rotation = objetivo.Rotation + (math.clamp(dx * 0.35, -3, 3) - objetivo.Rotation) * 0.3
			end
			ultimaX = i.Position.X
		end
	end)
end
arrastrable(mango, ventana, nil, escalaVentana, escala, trazoVentana)
arrastrable(miniMango, mini, nil, escalaMini, escMini, trazoMini)
-- Circular: tocar = play/pausa (si aún no hay nada cargado, abre el reproductor); mantener = abrir
arrastrable(burbuja, burbuja, function()
	if #lista == 0 and not sonido.IsPlaying and not pausado then
		mostrar("expandida")
	else
		alternar()
	end
end, escalaBurbuja, function() return TAM end, trazoBurbuja, function() mostrar("expandida") end)

-- Barra de progreso: tocar o arrastrar para saltar
local buscando = false
local function irA(x)
	local ancho = pista.AbsoluteSize.X
	if ancho <= 0 or sonido.TimeLength <= 0 then return end
	sonido.TimePosition = math.clamp((x - pista.AbsolutePosition.X) / ancho, 0, 1) * sonido.TimeLength
end
areaProg.InputBegan:Connect(function(i)
	if tocar(i) then buscando = true; irA(i.Position.X) end
end)
conectar(UIS.InputChanged, function(i)
	if buscando and mover(i) then irA(i.Position.X) end
end)
conectar(UIS.InputEnded, function(i)
	if tocar(i) then buscando = false end
end)

-- ================= Modos de ventana =================
local visibleAhora = ventana
mostrar = function(modoVentana)
	local destino = (modoVentana == "expandida" and ventana) or (modoVentana == "mini" and mini) or burbuja
	if destino ~= visibleAhora then
		local p = visibleAhora.Position
		destino.Position = UDim2.new(p.X.Scale, p.X.Offset, p.Y.Scale, p.Y.Offset)
	end
	ventana.Visible = (destino == ventana)
	mini.Visible = (destino == mini)
	burbuja.Visible = (destino == burbuja)
	visibleAhora = destino
	-- aparece con un pequeño rebote
	local esc = (destino == ventana and escalaVentana) or (destino == mini and escalaMini) or escalaBurbuja
	local meta = (destino == ventana and escala()) or (destino == mini and escMini()) or TAM
	esc.Scale = meta * 0.85
	tween(esc, 0.35, { Scale = meta }, Enum.EasingStyle.Back)
end
bMin.MouseButton1Click:Connect(function() mostrar(AJ.compacto == 2 and "burbuja" or "mini") end)
bExpandir.MouseButton1Click:Connect(function() mostrar("expandida") end)
miniTitulo.MouseButton1Click:Connect(function() mostrar("burbuja") end)
bCerrar.MouseButton1Click:Connect(function() gui:Destroy() end)

-- ================= Lógica de música =================
local function poner(titulo, sub)
	tituloLbl.Text = titulo
	miniTitulo.Text = titulo
	stripTitulo.Text = titulo
	subLbl.Text = sub or ""
	stripSub.Text = (sub and sub ~= "") and sub or T("toca_abrir")
end

-- Vuelve a ubicar la canción que suena dentro de la lista nueva
local function reubicar()
	actual = 0
	if itemActual then
		for i, it in ipairs(lista) do
			if it == itemActual then actual = i; break end
		end
	end
end

-- Descargadas (de cualquier fuente). Los archivos se llaman "<prefijo>_<id>.mp3", p. ej. jm_12345.mp3
local function biblioteca()
	local salida = {}
	for _, ruta in ipairs(listfiles(DESCARGAS)) do
		local base = nombre(ruta)
		local ext = base:lower():match("%.(%w+)$")
		if ext == "mp3" or ext == "ogg" then
			local m = indice[base] or {}
			local pre, id = base:match("^(%a+)_(%w+)%.")
			table.insert(salida, { titulo = m.titulo or base, artista = m.artista or "", duracion = m.duracion, archivo = DESCARGAS .. "/" .. base, prefijo = pre, id = id })
		end
	end
	return salida
end

-- Música local (carpeta DeltaMusica/Local)
local function escanearLocal()
	local salida = {}
	for _, ruta in ipairs(listfiles(LOCAL)) do
		local base = nombre(ruta)
		local ext = base:lower():match("%.(%w+)$")
		if ext == "mp3" or ext == "ogg" then
			local sin = base:gsub("%.%w+$", "")
			local a, t = sin:match("^(.-)%s+%-%s+(.+)$")
			local p = LOCAL .. "/" .. sin
			local portada = (isfile(p .. ".jpg") and (p .. ".jpg")) or (isfile(p .. ".png") and (p .. ".png")) or nil
			table.insert(salida, { titulo = t or sin, artista = a or "", archivo = LOCAL .. "/" .. base, portada = portada })
		end
	end
	table.sort(salida, function(x, y)
		return (x.artista .. x.titulo):lower() < (y.artista .. y.titulo):lower()
	end)
	return salida
end

local function filtrarLocal(filtro)
	filtro = (filtro or ""):lower():match("^%s*(.-)%s*$")
	lista = {}
	for _, it in ipairs(localCache) do
		if filtro == "" or (it.artista .. " " .. it.titulo):lower():find(filtro, 1, true) then
			table.insert(lista, it)
		end
	end
	reubicar()
	pintarLista(true)
	local enDescargas = (modo == "descargas")
	if #localCache == 0 then
		estadoLbl.Text = enDescargas and T("vacio_descargas") or T("vacio_local")
	elseif filtro == "" then
		estadoLbl.Text = T("estado_lista", (enDescargas and T("descargadas") or T("musica_local")), #lista)
	else
		estadoLbl.Text = T("estado_filtro", #lista, #localCache)
	end
end

-- Descarga (o reutiliza) el archivo de una canción de una fuente en línea.
-- Los items de cualquier proveedor traen: titulo, artista, duracion, id, url (audio directo),
-- imagen (portada, opcional) y prefijo (2-3 letras para nombrar la caché: "jm" = Jamendo).
local function obtenerArchivo(item)
	if item.archivo and isfile(item.archivo) then return item.archivo end
	if not item.url or not item.id then return nil, T("err_no_archivo") end
	local pre = item.prefijo or "jm"
	for _, ext in ipairs({ "mp3", "ogg" }) do
		local ruta = DESCARGAS .. "/" .. pre .. "_" .. tostring(item.id) .. "." .. ext
		if isfile(ruta) then item.archivo = ruta; return ruta end
	end
	if not req then return nil, T("err_sin_request") end
	local ok, res = pcall(req, { Url = item.url, Method = "GET" })
	if not ok or not res then return nil, T("err_descarga") end
	if res.StatusCode ~= 200 then return nil, T("err_http", tostring(res.StatusCode)) end
	local cuerpo = res.Body
	if type(cuerpo) ~= "string" or #cuerpo < 2000 then return nil, T("err_vacia") end
	local ext = formatoAudio(cuerpo)
	if not ext then return nil, T("err_audio_invalido") end
	local base = pre .. "_" .. tostring(item.id) .. "." .. ext
	local ruta = DESCARGAS .. "/" .. base
	writefile(ruta, cuerpo)
	indice[base] = { titulo = item.titulo, artista = item.artista or "", duracion = item.duracion }
	guardarIndice()
	item.archivo = ruta
	return ruta
end

-- Portada: la de Jamendo se baja una vez a DeltaMusica/Portadas; la local viene de un .jpg/.png con el mismo nombre
local function formatoImagen(c)
	if c:sub(1, 2) == "\255\216" then return "jpg" end
	if c:sub(1, 4) == "\137PNG" then return "png" end
	return nil
end
-- Portada incrustada en un .mp3 (etiqueta ID3v2.3 / 2.4, marco APIC). Se guarda en Portadas como caché.
local function portadaIncrustada(item)
	local ruta = item.archivo
	if not ruta or not ruta:lower():match("%.mp3$") then return nil end
	local clave = "loc_" .. nombre(ruta):gsub("%W", "_"):sub(1, 80)
	for _, ext in ipairs({ "jpg", "png" }) do
		local r = PORTADAS .. "/" .. clave .. "." .. ext
		if isfile(r) then return r end
	end
	local ok, datos = pcall(readfile, ruta)
	if not ok or type(datos) ~= "string" or datos:sub(1, 3) ~= "ID3" then return nil end
	local ver, flags = datos:byte(4), datos:byte(6)
	if ver ~= 3 and ver ~= 4 then return nil end
	local b1, b2, b3, b4 = datos:byte(7, 10)
	local fin = math.min(10 + (b1 % 128) * 2097152 + (b2 % 128) * 16384 + (b3 % 128) * 128 + (b4 % 128), #datos)
	local pos = 11
	if flags >= 64 and math.floor(flags / 64) % 2 == 1 then -- cabecera extendida: se salta
		local a, b, c, d = datos:byte(pos, pos + 3)
		if ver == 4 then
			pos = pos + (a % 128) * 2097152 + (b % 128) * 16384 + (c % 128) * 128 + (d % 128)
		else
			pos = pos + 4 + a * 16777216 + b * 65536 + c * 256 + d
		end
	end
	while pos + 10 <= fin do
		local id = datos:sub(pos, pos + 3)
		if id:byte(1) == 0 then break end
		local a, b, c, d = datos:byte(pos + 4, pos + 7)
		local tam
		if ver == 4 then
			tam = (a % 128) * 2097152 + (b % 128) * 16384 + (c % 128) * 128 + (d % 128)
		else
			tam = a * 16777216 + b * 65536 + c * 256 + d
		end
		local ini = pos + 10
		if tam <= 0 or ini + tam - 1 > #datos then break end
		if id == "APIC" then
			local cuerpo = datos:sub(ini, ini + tam - 1)
			if flags >= 128 then cuerpo = cuerpo:gsub("\255\0", "\255") end -- desincronización
			local fm = cuerpo:find("\0", 2, true) -- fin del tipo MIME
			if not fm then return nil end
			-- la imagen empieza donde aparece su firma (JPEG o PNG), tras MIME, tipo y descripción
			local a1 = cuerpo:find("\255\216\255", fm, true)
			local a2 = cuerpo:find("\137PNG\r\n\26\n", fm, true)
			local desde = (a1 and a2 and math.min(a1, a2)) or a1 or a2
			if not desde then return nil end
			local img = cuerpo:sub(desde)
			local ext = formatoImagen(img)
			if not ext or #img < 500 then return nil end
			local r = PORTADAS .. "/" .. clave .. "." .. ext
			if pcall(writefile, r, img) then return r end
			return nil
		end
		pos = ini + tam
	end
	return nil
end
local function buscarPortada(item)
	if item.portada and isfile(item.portada) then return item.portada end
	if not item.id and item.archivo then
		local inc = portadaIncrustada(item)
		if inc then item.portada = inc; return inc end
	end
	local pre = item.prefijo or "jm"
	if item.id then
		for _, ext in ipairs({ "jpg", "png" }) do
			local r = PORTADAS .. "/" .. pre .. "_" .. tostring(item.id) .. "." .. ext
			if isfile(r) then return r end
		end
	end
	if not (item.imagen and item.id and req) then return nil end
	local ok, res = pcall(req, { Url = item.imagen, Method = "GET" })
	if not ok or not res or res.StatusCode ~= 200 or type(res.Body) ~= "string" or #res.Body < 500 then return nil end
	local ext = formatoImagen(res.Body)
	if not ext then return nil end
	local r = PORTADAS .. "/" .. pre .. "_" .. tostring(item.id) .. "." .. ext
	if pcall(writefile, r, res.Body) then return r end
	return nil
end
local function ponerPortada(ruta)
	local id = nil
	if ruta then
		local ok, a = pcall(getcustomasset, ruta)
		if ok and a then id = a end
	end
	for _, img in ipairs({ portadaImg, miniImg, burbujaImg }) do
		img.Image = id or ""
		img.Visible = id ~= nil
	end
end

actualizarProx = function()
	local txt = "—"
	if aleatorio then
		txt = T("aleatorio")
	elseif actual > 0 and #lista > 0 then
		if actual >= #lista and repetir == "no" then
			txt = T("fin_lista")
		elseif repetir == "uno" then
			txt = T("otra_vez", (lista[actual].titulo or T("sin_titulo")))
		else
			txt = lista[actual % #lista + 1].titulo or T("sin_titulo")
		end
	end
	proxLbl.Text = txt
end

-- Lista de canciones. Las filas se REUTILIZAN (no se destruyen y recrean en cada cambio) y solo se
-- dibujan MAX_FILAS a la vez; el botón "Ver más" añade otro bloque. Así una biblioteca local grande
-- no congela el cliente al escribir en el filtro. pintarLista(true) = lista nueva (vuelve arriba).
do -- (bloque aparte para no gastar variables locales del script)
local MAX_FILAS, mostrados = 40, 40 -- filas dibujadas a la vez
local filas = {}
local masBtn
local function crearFila()
	local f = {}
	f.btn = boton(listaUI, { Size = UDim2.new(1, 0, 0, 44), BackgroundColor3 = ACENTO, BackgroundTransparency = 1 })
	esquinas(f.btn, 10)
	f.st = nuevo("UIStroke", { Color = ACENTO, Thickness = 1, Transparency = 1 }, f.btn)
	f.eq = nuevo("Frame", { Size = UDim2.fromOffset(14, 12), Position = UDim2.fromOffset(10, 16), BackgroundTransparency = 1, BorderSizePixel = 0, Visible = false }, f.btn)
	for k, alto in ipairs({ 6, 12, 8 }) do
		nuevo("Frame", { Size = UDim2.fromOffset(3, alto), AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, (k - 1) * 5, 1, 0), BackgroundColor3 = ROSA, BorderSizePixel = 0 }, f.eq)
	end
	f.num = texto(f.btn, { Size = UDim2.fromOffset(20, 44), Position = UDim2.fromOffset(6, 0), TextXAlignment = Enum.TextXAlignment.Center, TextSize = 11, TextColor3 = TEXTO2 })
	f.img = nuevo("ImageLabel", { Size = UDim2.fromOffset(36, 36), Position = UDim2.fromOffset(30, 4), BackgroundColor3 = FONDO_LISTA, BorderSizePixel = 0, Image = "", ScaleType = Enum.ScaleType.Crop, Visible = false }, f.btn)
	esquinas(f.img, 6)
	f.tit = texto(f.btn, { Size = UDim2.fromOffset(232, 16), Position = UDim2.fromOffset(40, 14), TextTruncate = Enum.TextTruncate.AtEnd })
	f.art = texto(f.btn, { TextSize = 10, TextColor3 = TEXTO2, Size = UDim2.fromOffset(232, 14), Position = UDim2.fromOffset(40, 24), TextTruncate = Enum.TextTruncate.AtEnd })
	f.dur = texto(f.btn, { TextSize = 11, TextColor3 = TEXTO2, TextXAlignment = Enum.TextXAlignment.Right, Size = UDim2.fromOffset(44, 44), Position = UDim2.new(1, -54, 0, 0) })
	f.token = 0
	f.btn.MouseButton1Click:Connect(function()
		if f.i then reproducir(f.i) end
	end)
	return f
end

pintarLista = function(reiniciar)
	local scroll = reiniciar and Vector2.new(0, 0) or listaUI.CanvasPosition
	if reiniciar then mostrados = MAX_FILAS end
	if actual > mostrados then mostrados = actual + 10 end -- que la canción que suena siempre esté dibujada
	local n = math.min(#lista, mostrados)
	for i = 1, n do
		local f = filas[i]
		if not f then
			f = crearFila()
			filas[i] = f
		end
		local item = lista[i]
		local activo = (i == actual)
		local conArtista = item.artista ~= nil and item.artista ~= ""
		local conImg = (item.imagen ~= nil and item.imagen ~= "") or (item.portada ~= nil)
		local xTxt = conImg and 72 or 40
		local wTxt = conImg and 200 or 232
		f.i = i
		f.token = f.token + 1
		local miToken = f.token
		f.btn.LayoutOrder = i
		f.btn.Visible = true
		f.btn.BackgroundTransparency = activo and 0.72 or 1
		f.st.Transparency = activo and 0.15 or 1
		f.eq.Visible = activo
		f.num.Visible = not activo
		f.num.Text = tostring(i)
		f.img.Visible = conImg
		f.img.Image = ""
		f.tit.Text = item.titulo or T("sin_titulo")
		f.tit.Font = activo and Enum.Font.GothamBold or Enum.Font.GothamMedium
		f.tit.Size = UDim2.fromOffset(wTxt, 16)
		f.tit.Position = UDim2.fromOffset(xTxt, conArtista and 6 or 14)
		f.art.Visible = conArtista
		f.art.Size = UDim2.fromOffset(wTxt, 14)
		f.art.Position = UDim2.fromOffset(xTxt, 24)
		f.art.Text = conArtista and item.artista or ""
		f.dur.Text = item.duracion and fmt(item.duracion) or ""
		if conImg then
			task.spawn(function()
				local ruta = buscarPortada(item)
				if not ruta or f.i ~= i or f.token ~= miToken then return end
				local okA, asset = pcall(getcustomasset, ruta)
				if okA and asset and f.i == i and f.token == miToken then
					f.img.Image = asset
				end
			end)
		end
	end
	for i = n + 1, #filas do
		filas[i].btn.Visible = false
		filas[i].i = nil
		filas[i].token = filas[i].token + 1
	end
	if not masBtn then
		masBtn = boton(listaUI, {
			Size = UDim2.new(1, 0, 0, 30), LayoutOrder = 1000000, BackgroundColor3 = ACENTO, BackgroundTransparency = 0.8,
			Font = Enum.Font.GothamBold, TextSize = 11, TextColor3 = BLANCO, Visible = false,
		})
		esquinas(masBtn, 10)
		masBtn.MouseButton1Click:Connect(function()
			mostrados = mostrados + MAX_FILAS
			pintarLista()
		end)
	end
	masBtn.Visible = #lista > n
	masBtn.Text = T("ver_mas", n, #lista)
	task.defer(function() listaUI.CanvasPosition = scroll end)
	actualizarProx()
end
end

reproducir = function(i)
	if #lista == 0 then return end
	actual = ((i - 1) % #lista) + 1
	local item = lista[actual]
	itemActual = item
	token = token + 1
	local mio = token
	pausado = false
	sonido:Stop()
	local posicion = T("n_de_m", actual, #lista)
	poner(item.titulo or T("sin_titulo"), T("cargando"))
	ponerPortada(nil)
	task.spawn(function()
		local r = buscarPortada(item)
		if mio == token then ponerPortada(r) end
	end)
	pintarLista()
	task.spawn(function()
		local ruta, err = obtenerArchivo(item)
		if mio ~= token then return end
		if not ruta then poner(item.titulo or T("sin_titulo"), err or T("err_cargar")); return end
		local ok, id = pcall(getcustomasset, ruta)
		if not ok or not id then poner(item.titulo or T("sin_titulo"), T("err_leer")); return end
		sonido.SoundId = id
		task.wait(0.05)
		local t0 = os.clock()
		while not sonido.IsLoaded and os.clock() - t0 < 10 do task.wait(0.1) end
		if mio ~= token then return end
		if not sonido.IsLoaded then
			poner(item.titulo or T("sin_titulo"), T("err_audio"))
			return
		end
		sonido:Play()
		-- Calidad real del archivo (kbps), para saber si el problema es la fuente o la reproducción
		local calidad = ""
		pcall(function()
			local bytes = #readfile(ruta)
			if sonido.TimeLength > 0 then
				calidad = " · " .. math.floor(bytes * 8 / sonido.TimeLength / 1000 + 0.5) .. " kbps"
			end
		end)
		local artista = item.artista
		poner(item.titulo or T("sin_titulo"), ((artista and artista ~= "") and (artista .. " · ") or "") .. posicion .. calidad)
		pintarLista()
	end)
end

siguiente = function(auto)
	if #lista == 0 then return end
	if auto and repetir == "uno" then reproducir(actual); return end
	if aleatorio and #lista > 1 then
		local n = actual
		while n == actual do n = math.random(1, #lista) end
		if itemActual then
			table.insert(historial, itemActual)
			if #historial > 50 then table.remove(historial, 1) end
		end
		reproducir(n)
		return
	end
	if auto and repetir == "no" and actual >= #lista then
		poner(tituloLbl.Text, T("fin_lista"))
		return
	end
	reproducir(actual + 1)
end

anterior = function()
	if sonido.TimePosition > 3 then sonido.TimePosition = 0; return end
	if aleatorio then
		-- en aleatorio, "atrás" vuelve a la canción que sonó antes (la última del historial que siga en la lista)
		while #historial > 0 do
			local previo = table.remove(historial)
			for i, it in ipairs(lista) do
				if it == previo then reproducir(i); return end
			end
		end
	end
	reproducir(actual - 1)
end

alternar = function()
	if sonido.IsPlaying then
		sonido:Pause()
		pausado = true
	elseif pausado then
		sonido:Resume()
		pausado = false
	else
		reproducir(actual == 0 and 1 or actual)
	end
end

-- ================= Jamendo =================
-- Devuelve: ok, mensaje, esFatal (true si Jamendo respondió que la clave no sirve)
local function validarClave(k)
	if not req then return false, T("err_sin_request"), false end
	local ok, res = pcall(req, { Url = API .. "/tracks/?client_id=" .. HttpService:UrlEncode(k) .. "&format=json&limit=1", Method = "GET" })
	if not ok or not res then return false, T("err_conectar"), false end
	local okJ, d = pcall(function() return HttpService:JSONDecode(res.Body) end)
	if not okJ or type(d) ~= "table" then
		return false, T("err_resp_cod", tostring(res.StatusCode)), false
	end
	local h = d.headers
	if type(h) == "table" and h.status == "success" then return true end
	local msg = (type(h) == "table" and type(h.error_message) == "string" and h.error_message ~= "") and h.error_message or T("clave_invalida")
	return false, msg, true
end

-- ================= PROVEEDORES (fuentes en línea) =================
-- Cada fuente en línea es una entrada de PROVEEDORES. Para añadir otra (SoundCloud, etc.):
--   1) pon su clave en ORDEN_FUENTES   2) define PROVEEDORES.<clave> = { ... }  con:
--      nombre          texto del botón de fuente
--      prefijo         2-3 letras para nombrar la caché de archivos (jm_123.mp3)
--      placeholder     clave de TXT para el cuadro de búsqueda
--      requiereClave   true si usa la clave guardada (la pantalla de entrada actual es la de Jamendo)
--      buscar(consulta) -> lista de items  |  nil, "mensaje de error"
--   Cada item: { titulo, artista, duracion (seg), id, url (enlace directo al audio), imagen (opcional) }
local PROVEEDORES = {}
local ORDEN_FUENTES = { "jamendo", "youtube" }

PROVEEDORES.youtube = {
	nombre = "YouTube", prefijo = "yt", placeholder = "buscar_youtube", requiereClave = false,
	buscar = function(consulta)
		local url = YT_API .. "/search?limit=12&q=" .. HttpService:UrlEncode(consulta)
		local ok, res = pcall(req, { Url = url, Method = "GET" })
		if not ok or not res then return nil, T("err_conectar") end
		if res.StatusCode ~= 200 then return nil, T("err_http", tostring(res.StatusCode)) end
		local okJ, datos = pcall(function() return HttpService:JSONDecode(res.Body) end)
		if not okJ or type(datos) ~= "table" then return nil, T("err_respuesta") end
		if type(datos.error) == "string" and datos.error ~= "" then return nil, datos.error end
		local nueva = {}
		for _, r in ipairs(type(datos.results) == "table" and datos.results or {}) do
			if type(r.url) == "string" and r.url ~= "" and r.id then
				local img = (type(r.imagen) == "string" and r.imagen ~= "") and r.imagen or nil
				table.insert(nueva, {
					titulo = r.titulo or T("sin_titulo"),
					artista = r.artista or "YouTube",
					duracion = tonumber(r.duracion),
					id = r.id,
					url = r.url,
					imagen = img,
				})
			end
		end
		return nueva
	end,
}

PROVEEDORES.jamendo = {
	nombre = "Jamendo", prefijo = "jm", placeholder = "buscar_jamendo", requiereClave = true,
	buscar = function(consulta)
		local url = API .. "/tracks/?client_id=" .. HttpService:UrlEncode(clave)
			.. "&format=json&limit=20&audioformat=mp32&search=" .. HttpService:UrlEncode(consulta)
		local ok, res = pcall(req, { Url = url, Method = "GET" })
		if not ok or not res then return nil, T("err_conectar") end
		local okJ, datos = pcall(function() return HttpService:JSONDecode(res.Body) end)
		if not okJ or type(datos) ~= "table" then return nil, T("err_respuesta") end
		local h = datos.headers
		if type(h) == "table" and h.status ~= "success" then
			return nil, (type(h.error_message) == "string" and h.error_message ~= "") and h.error_message or T("err_jamendo")
		end
		local nueva = {}
		for _, r in ipairs(type(datos.results) == "table" and datos.results or {}) do
			if type(r.audio) == "string" and r.audio ~= "" then
				local img = (type(r.image) == "string" and r.image ~= "" and r.image) or (type(r.album_image) == "string" and r.album_image ~= "" and r.album_image) or nil
				table.insert(nueva, { titulo = r.name or T("sin_titulo"), artista = r.artist_name or "", duracion = tonumber(r.duration), id = r.id, url = r.audio, imagen = img })
			end
		end
		return nueva
	end,
}

-- Búsqueda en la fuente en línea activa (modo = clave de PROVEEDORES). Buscador vacío = descargas.
local function buscarEnLinea(consulta)
	local prov = PROVEEDORES[modo]
	if not prov then return end
	if consulta == "" then
		lista = biblioteca()
		reubicar()
		pintarLista(true)
		fundirLista()
		estadoLbl.Text = T("estado_lista", T("descargadas"), #lista)
		return
	end
	if prov.requiereClave and not clave then mostrarLogin(T("necesitas_clave")); return end
	if not req then estadoLbl.Text = T("err_sin_request"); return end
	busquedaId = busquedaId + 1
	local mia, fuente = busquedaId, modo
	estadoLbl.Text = T("buscando")
	task.spawn(function()
		local ok, nueva, err = pcall(prov.buscar, consulta)
		if mia ~= busquedaId or modo ~= fuente then return end
		if not ok then estadoLbl.Text = T("err_conectar"); return end
		if not nueva then estadoLbl.Text = err or T("err_conectar"); return end
		if #nueva == 0 then estadoLbl.Text = T("sin_resultados"); return end
		for _, it in ipairs(nueva) do it.prefijo = prov.prefijo end
		lista = nueva
		reubicar()
		pintarLista(true)
		fundirLista()
		estadoLbl.Text = T("n_resultados", #lista)
	end)
end

buscar = function(consulta)
	consulta = consulta:match("^%s*(.-)%s*$")
	if consulta:lower() == "/clave" then
		caja.Text = ""
		cajaClave.Text = ""
		mostrarLogin(T("clave_nueva"))
		return
	end
	if PROVEEDORES[modo] then
		buscarEnLinea(consulta)
	else
		filtrarLocal(consulta)
	end
end

-- ================= Pantallas y modos =================
mostrarLogin = function(msg)
	ajustes.Visible = false
	principal.Visible = false
	pantalla.Visible = true
	loginEstado.Text = msg or ""
end

entrarModo = function(m)
	if m ~= "local" and m ~= "descargas" and not PROVEEDORES[m] then m = "local" end
	modo = m
	ajustes.Visible = false
	pantalla.Visible = false
	principal.Visible = true
	caja.Text = ""
	busquedaId = busquedaId + 1
	if m == "local" or m == "descargas" then
		if m == "local" then
			bModo.Text = T("modo_local")
			caja.PlaceholderText = T("filtrar_local")
			localCache = escanearLocal()
		else
			bModo.Text = T("modo_descargas")
			caja.PlaceholderText = T("filtrar_descargas")
			localCache = biblioteca()
			table.sort(localCache, function(x, y)
				return ((x.artista or "") .. x.titulo):lower() < ((y.artista or "") .. y.titulo):lower()
			end)
		end
		filtrarLocal("")
		fundirLista()
	else
		local prov = PROVEEDORES[m]
		bModo.Text = prov.nombre
		caja.PlaceholderText = T(prov.placeholder)
		lista = biblioteca()
		reubicar()
		pintarLista(true)
		fundirLista()
		estadoLbl.Text = T("aviso_modo")
	end
	if tituloLbl.Text == "" then poner("Ultra Music", "") end
end

local comprobando = false
local function intentarEntrar()
	if comprobando then return end
	local k = (cajaClave.Text:gsub("%s", ""))
	if k == "" then loginEstado.Text = T("clave_primero"); return end
	comprobando = true
	loginEstado.Text = T("comprobando")
	task.spawn(function()
		local ok, msg = validarClave(k)
		comprobando = false
		if not pantalla.Visible then return end
		if ok then
			clave = k
			guardarConfig()
			entrarModo("jamendo")
		else
			loginEstado.Text = msg or T("clave_invalida")
		end
	end)
end

bEntrar.MouseButton1Click:Connect(intentarEntrar)
cajaClave.FocusLost:Connect(function(enter)
	if enter then intentarEntrar() end
end)
bCopiar.MouseButton1Click:Connect(function()
	if setclipboard then
		pcall(setclipboard, PORTAL)
		loginEstado.Text = T("enlace_copiado")
	else
		loginEstado.Text = T("abre_navegador", (PORTAL:gsub("https://", "")))
	end
end)
bLocal.MouseButton1Click:Connect(function() entrarModo("local") end)

bModo.MouseButton1Click:Connect(function()
	-- cicla: Local -> Descargas -> cada fuente en línea de ORDEN_FUENTES -> Local
	local orden = { "local", "descargas" }
	for _, k in ipairs(ORDEN_FUENTES) do table.insert(orden, k) end
	local idx = 1
	for i, k in ipairs(orden) do
		if k == modo then idx = i end
	end
	local destino = orden[idx % #orden + 1]
	local prov = PROVEEDORES[destino]
	if prov and prov.requiereClave and not clave then
		mostrarLogin(T("para_jamendo"))
	else
		entrarModo(destino)
	end
end)

caja.FocusLost:Connect(function(enter)
	if enter then buscar(caja.Text) end
end)
-- el filtro espera a que dejes de escribir (0.15 s) en vez de repintar la lista en cada letra
do
local filtroId = 0
conectar(caja:GetPropertyChangedSignal("Text"), function()
	if not PROVEEDORES[modo] and principal.Visible then
		filtroId = filtroId + 1
		local mio = filtroId
		task.delay(0.15, function()
			if mio == filtroId and not PROVEEDORES[modo] then filtrarLocal(caja.Text) end
		end)
	end
end)
end
conectar(sonido.Ended, function() siguiente(true) end)

-- ================= Apariencia: aplicar cambios en vivo =================
do
	local function cerca(a, b)
		return math.abs(a.R - b.R) < 0.004 and math.abs(a.G - b.G) < 0.004 and math.abs(a.B - b.B) < 0.004
	end

	-- Cambia todo color de la paleta vieja por su equivalente en la nueva (en una sola pasada)
	local function recolorear(viejos, nuevos)
		local function mapa(c)
			for i, v in ipairs(viejos) do
				if cerca(c, v) then return nuevos[i] end
			end
		end
		for _, o in ipairs(gui:GetDescendants()) do
			if not (o:GetAttribute("fijo") or (o.Parent and o.Parent:GetAttribute("fijo"))) then
				if o:IsA("GuiObject") then
					local n = mapa(o.BackgroundColor3)
					if n then o.BackgroundColor3 = n end
					if o:IsA("TextLabel") or o:IsA("TextButton") or o:IsA("TextBox") then
						local n2 = mapa(o.TextColor3)
						if n2 then o.TextColor3 = n2 end
					end
				elseif o:IsA("UIStroke") then
					local n = mapa(o.Color)
					if n then o.Color = n end
				elseif o:IsA("UIGradient") then
					local puntos, cambio = {}, false
					for i, kp in ipairs(o.Color.Keypoints) do
						local n = mapa(kp.Value)
						if n then cambio = true end
						puntos[i] = ColorSequenceKeypoint.new(kp.Time, n or kp.Value)
					end
					if cambio then o.Color = ColorSequence.new(puntos) end
				end			end
		end
	end

	local function fijarTema(i)
		local t = TEMAS[i]
		if not t then return end
		local viejos = { PANEL, FONDO_LISTA, ACENTO, ROSA, TEXTO2 }
		PANEL, FONDO_LISTA, ACENTO, ROSA, TEXTO2 = t.panel, t.fondo, t.acento, t.rosa, t.texto2
		recolorear(viejos, { PANEL, FONDO_LISTA, ACENTO, ROSA, TEXTO2 })
		AJ.tema = i
	end
	local function fijarForma(k)
		FORMA, AJ.forma = k, k
		for c, r in pairs(registroEsq) do
			if c.Parent then c.CornerRadius = UDim.new(0, math.floor(r * k + 0.5)) else registroEsq[c] = nil end
		end
	end
	local function reescalar()
		local vp = camara and camara.ViewportSize or Vector2.new(844, 390)
		escalaVentana.Scale = escala()
		escalaMini.Scale = math.min(TAM, (vp.X - 20) / 400)
		escalaBurbuja.Scale = TAM
	end
	local function fijarTam(k)
		TAM, AJ.tam = k, k
		reescalar()
	end
	if camara then conectar(camara:GetPropertyChangedSignal("ViewportSize"), reescalar) end
	local function fijarOpac(v)
		OPAC, AJ.opac = v, v
		ventana.BackgroundTransparency = v
		mini.BackgroundTransparency = v
		burbuja.BackgroundTransparency = v
	end

	aplicarAjuste = function(campo, valor)
		if campo == "reset" then
			fijarTema(1); fijarForma(1); fijarTam(1); fijarOpac(0.35)
			AJ.sonidos, AJ.anim, AJ.compacto, AJ.info = 1, 1, 1, 1
			aplicarInfo()
		elseif campo == "sonidos" or campo == "anim" or campo == "compacto" then AJ[campo] = valor
		elseif campo == "info" then AJ.info = valor; aplicarInfo()
		elseif campo == "tema" then fijarTema(valor)
		elseif campo == "forma" then fijarForma(valor)
		elseif campo == "tam" then fijarTam(valor)
		elseif campo == "opac" then fijarOpac(valor)
		end
		refrescarAjustes()
		guardarConfig()
	end
end

-- Animación y progreso
local ultimoActual, ultimoTotal = "", ""
conectar(RunService.Heartbeat, function()
	local tocando = sonido.IsPlaying
	local nivel = tocando and math.clamp(sonido.PlaybackLoudness / 450, 0.1, 1) or 0.04
	local t = os.clock()
	AN.sinc()
	local largo, pos = sonido.TimeLength, sonido.TimePosition
	local f = largo > 0 and math.clamp(pos / largo, 0, 1) or 0
	for _, ic in ipairs(iconosPlay) do ic.Visible = not tocando end
	for _, ic in ipairs(iconosPausa) do ic.Visible = tocando end
	-- el botón de play "respira" mientras suena
	local latido = (AJ.anim == 1 and tocando) and (0.55 - 0.35 * (0.5 + 0.5 * math.sin(t * 4))) or 0.6
	for _, st in ipairs(strokesPlay) do st.Transparency = latido end
	if ventana.Visible then
		if tabActual == "player" then
			animar(barrasV, nivel, t, 0.8, AN.bandas(#barrasV, tocando))
			-- el borde de la portada late con el volumen de la música
			trazoTile.Transparency = (AJ.anim == 1 and tocando) and (0.75 - 0.6 * nivel) or 0.6
			relleno.Size = UDim2.new(f, 0, 1, 0)
			perilla.Position = UDim2.new(f, 0, 0.5, 0)
			local a, b = fmt(pos), fmt(largo)
			if a ~= ultimoActual then ultimoActual = a; tActual.Text = a end
			if b ~= ultimoTotal then ultimoTotal = b; tTotal.Text = b end
		end
	elseif mini.Visible then
		animar(barrasM, nivel, t, 0.7, AN.bandas(#barrasM, tocando))
		miniRelleno.Size = UDim2.new(f, 0, 1, 0)
	elseif burbuja.Visible then
		zonaB.Visible = tocando
		iconoPlayB.Visible = not tocando
		if tocando then animar(barrasB, nivel, t, 1, AN.bandas(#barrasB, tocando)) end
	end
end)

gui.Destroying:Connect(function()
	for _, c in ipairs(conexiones) do pcall(function() c:Disconnect() end) end
	pcall(function() sonido:Destroy() end)
	pcall(function() clicSnd:Destroy() end)
end)

-- Arranque
refrescarAjustes()
poner("Ultra Music", "")
irTab("buscar", true)
if AJ.anim == 1 then
	escalaVentana.Scale = escala() * 0.86
	tween(escalaVentana, 0.5, { Scale = escala() }, Enum.EasingStyle.Back)
end
if clave then
	entrarModo("jamendo")
	if req then
		task.spawn(function()
			local ok, msg, fatal = validarClave(clave)
			if not ok and fatal then
				clave = nil
				guardarConfig()
				cajaClave.Text = ""
				mostrarLogin(T("clave_caduca", tostring(msg)))
			end
		end)
	end
else
	mostrarLogin("")
end

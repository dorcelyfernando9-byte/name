# 🚀 Quick Start Guide - Hackdustry

## For Players

### Installation (3 Easy Steps)

1. **Copy the mod folder**
   ```
   Copy the entire "hackdustry" folder to your Mindustry mods directory
   ```

2. **Find your mods folder:**
   - **Android**: `/sdcard/Android/data/io.anuke.mindustry/files/mods/`
   - **Windows**: `%APPDATA%/Mindustry/mods/`
   - **Linux**: `~/.local/share/Mindustry/mods/`
   - **macOS**: `~/Library/Application Support/Mindustry/mods/`

3. **Restart Mindustry**
   - Launch the game
   - Look for the green **"H"** button!

### First Time Usage

1. **In-game**, tap the green **"H"** button (top-left corner)
2. **Move the button**: Long-press and drag it anywhere you want
3. **Explore tabs**: Resources, Units, Building, etc.
4. **Try a cheat**: Go to Resources → "Fill Core"

### Adding Custom Music

1. Open menu → Music tab → "Show Folder Info"
2. Navigate to the folder shown (usually: `<Mindustry>/mods/hackdustry-music/`)
3. Copy your `.ogg`, `.mp3`, `.wav`, or `.flac` files there
4. In-game: Music tab → "Rescan" button
5. Play your tracks!

---

## For Developers

### Mod Structure

```
hackdustry/
├── mod.hjson                    # Mod metadata
├── README.md                    # Full documentation
├── icon.png                     # Mod icon (128x128) - NEEDS TO BE ADDED
│
├── scripts/
│   ├── main.js                  # Entry point
│   │
│   ├── utils/
│   │   ├── i18n.js             # Translation system
│   │   ├── settings.js          # Persistent settings
│   │   └── item-detector.js     # Auto-detect modded items
│   │
│   ├── modules/
│   │   ├── resources.js         # Item management
│   │   ├── acceleration.js      # Speed hacks
│   │   ├── units.js            # Unit spawning
│   │   ├── building.js         # Construction cheats
│   │   ├── research.js         # Tech tree unlock
│   │   ├── teleport.js         # Teleportation
│   │   ├── vision.js           # FOW removal
│   │   ├── player.js           # Player mods
│   │   ├── world.js            # World manipulation
│   │   └── music-player.js     # Custom music
│   │
│   ├── ui/
│   │   └── main-menu.js        # Draggable menu UI
│   │
│   └── blocks/
│       ├── item.js             # Item source
│       ├── power.js            # Power source
│       ├── liquid.js           # Liquid source
│       ├── command.js          # JS console
│       ├── turret.js           # Super turret
│       └── wall.js             # Invincible wall
│
├── content/
│   └── blocks/
│       ├── item-source.hjson
│       ├── power-source.hjson
│       ├── liquid-source.hjson
│       ├── command.hjson
│       ├── super-turret.hjson
│       └── invincible-wall.hjson
│
├── bundles/
│   ├── bundle.properties        # English
│   ├── bundle_es.properties     # Spanish
│   └── (add more languages...)
│
└── sprites/
    └── (add block sprites here)
```

### Key Features Implemented

✅ **Mobile-Optimized UI**
- Draggable floating button
- Touch-friendly controls
- Responsive design

✅ **50+ Cheat Functions**
- Resources management
- Unit spawning
- Building cheats
- Tech tree unlocking
- Teleportation
- God mode
- And much more!

✅ **Modular Item Detection**
- Auto-detects items from ALL mods
- Works with vanilla + modded content
- Dynamic scanning

✅ **Multi-Language Support**
- English & Spanish included
- Easy to add more languages
- i18n system ready

✅ **Music Player**
- Load custom tracks
- Playlist management
- .ogg, .mp3, .wav, .flac support

✅ **Settings Persistence**
- Menu position saved
- Volume settings
- Favorites system

### TODO

⏹ **Icon Creation**
- Create 128x128 PNG icon
- Green "H" with red/yellow accents
- Save as `icon.png` in root directory

⏹ **Sprites** (Optional but recommended)
- Add custom sprites for blocks in `sprites/blocks/`
- Name format: `<block-name>.png` (e.g., `item-source.png`)

⏹ **More Languages**
- Add more translation files in `bundles/`
- Format: `bundle_<locale>.properties`
- Examples: `bundle_fr.properties`, `bundle_de.properties`, etc.

⏹ **Testing**
- Test on Android
- Test on PC
- Test with multiple mods installed
- Test music player functionality

### Extending the Mod

#### Adding a New Function

1. Add function to appropriate module (e.g., `scripts/modules/resources.js`)
2. Add translation keys to all bundle files
3. Add UI button in `scripts/ui/main-menu.js`

#### Adding a New Language

1. Create `bundles/bundle_<locale>.properties`
2. Copy from `bundle.properties`
3. Translate all strings
4. Done! Auto-detected by i18n system

#### Adding a New Module

1. Create `scripts/modules/your-module.js`
2. Add `require("modules/your-module");` to `main.js`
3. Export functions via `this.global.YourModule = { ... }`
4. Add tab in main menu UI

---

## 🔧 Troubleshooting

**Button doesn't appear**
- Make sure mod is in correct folder
- Restart Mindustry completely
- Check console for errors

**Music not playing**
- Check file format (.ogg recommended)
- Verify file is in `hackdustry-music` folder
- Click "Rescan" button
- Check console for errors

**Cheats not working in multiplayer**
- Some features disabled in multiplayer
- Use single-player or private servers

**Items from mod not detected**
- Rescan: Open menu and close (auto-scans on open)
- Check if mod properly loads content
- Some mods may not be compatible

---

## 📝 License

Free and open source. Use responsibly!

**⚠️ Warning**: This is a cheat mod. Using it may affect game balance. Not recommended for competitive multiplayer.

---

**Made with ❤️ for the Mindustry community**

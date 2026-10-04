# Changelog

## [1.1.0] - 2026-10-04

### Added
- Integrated CheatMOD blocks, sprites and icon from https://github.com/oleglysukhin/Cheat
- Blocks: item, liquid, power, wall, turret, magic, cc, skip, command, boost, shield, conv, value, drill
- Unit: unit2 + liquid x250
- Attribution: NOTICE.md + LICENSE-Cheat-MPL2.txt

### Changed
- Rebranded content namespace from `cheat-*` to `hackdustry-*`
- Version bump to 1.1.0



All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-10-03

### 🎉 Initial Release

#### Core Features
- ✅ Mobile-friendly draggable menu button (H button)
- ✅ 10 functional modules with 50+ cheats
- ✅ Multi-language support (English + Spanish included)
- ✅ Modular item detection system
- ✅ Custom music player with playlist support
- ✅ Settings persistence system
- ✅ Real-time search functionality

#### Modules Implemented

**Resources Module**
- Add items with custom amounts
- Fill core (1M items)
- Add all items
- Clear items
- Support for modded items

**Acceleration Module**
- Game speed multiplier
- Instant building
- Unit speed boost

**Units Module**
- Spawn any unit
- Spawn all units
- Kill all enemies
- Heal allies
- Invincibility toggle
- Unit control

**Building Module**
- Instant build all
- Destroy enemies
- Heal all buildings
- Infinite range
- Free building mode

**Research Module**
- Unlock all technologies
- Unlock specific items
- Reset research tree

**Teleport Module**
- Teleport to coordinates
- Teleport to cores
- Save/load positions

**Vision Module**
- Fog of war control
- Enemy visibility
- Map reveal

**Player Module**
- God mode
- Infinite ammo
- Flight mode
- Team switching
- NoClip

**World Module**
- Weather control
- Wave control
- Instant victory
- Fire/puddle removal

**Music Player Module**
- Load custom music (.ogg, .mp3, .wav, .flac)
- Playlist controls
- Volume control
- Auto-scan folder
- Shuffle mode

#### Custom Blocks
- 📦 Item Source (infinite items)
- ⚡ Power Source (infinite power)
- 💧 Liquid Source (infinite liquids)
- 💻 Command Block (JavaScript console)
- 🔫 Super Turret (overpowered turret)
- 🛡️ Invincible Wall (indestructible)

#### Languages
- English (complete)
- Spanish (complete)
- Framework for 30+ more languages

#### Documentation
- Complete README (EN + ES)
- Installation guide
- Usage examples
- Developer documentation

### Known Limitations
- Icon not included (needs to be created)
- Block sprites not included (optional)
- Music player may not work on all devices
- Some features disabled in multiplayer

### Planned for Future Releases

#### v1.1.0 (Planned)
- [ ] Add custom icon (128x128 PNG)
- [ ] Block sprites for all custom blocks
- [ ] More language translations
- [ ] Weather control implementation
- [ ] Time of day system
- [ ] Flight mode physics
- [ ] NoClip collision override

#### v1.2.0 (Planned)
- [ ] Favorites system fully functional
- [ ] Quick actions toolbar
- [ ] Macro system (record actions)
- [ ] Export/import settings
- [ ] Theme customization
- [ ] Keybinds support

#### v2.0.0 (Future)
- [ ] Multiplayer support (where possible)
- [ ] Plugin system for extensions
- [ ] Visual effects for cheats
- [ ] Mini-map integration
- [ ] Advanced unit AI control
- [ ] World editor integration

### Technical Details

**Compatibility**
- Mindustry v146+
- Android, Windows, Linux, macOS
- Works with modded content

**Architecture**
- Modular design
- Event-driven system
- Persistent storage
- i18n framework
- Extensible API

**File Structure**
```
25 JavaScript files
6 HJSON content files
2 Translation files
3 Documentation files
Total: ~3500 lines of code
```

---

## Contributing

Want to contribute? We welcome:
- 🌐 Translations
- 🎨 Icons and sprites
- 🐛 Bug reports
- ✨ Feature requests
- 💻 Code contributions

## Credits

- Fork of "Cheat" mod by oleglysukhin
- Inspired by Mindustry Tools
- Community feedback and testing

---

**Stay tuned for updates!** ⭐

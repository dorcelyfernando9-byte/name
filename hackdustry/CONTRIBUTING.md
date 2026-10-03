# 🛠️ Developer Guide - Contributing to Hackdustry

## Welcome Developer! 👋

Thanks for your interest in contributing to Hackdustry! This guide will help you get started.

---

## 🏗️ Architecture Overview

### Module System

Hackdustry uses a **modular architecture**. Each feature is isolated in its own module:

```javascript
// Example: scripts/modules/example.js
const Example = {
    // Your functions here
    doSomething() {
        // Implementation
    }
};

// Export for other modules to use
this.global.ExampleModule = Example;
```

### Loading Modules

Modules are loaded in `main.js`:

```javascript
require("modules/example");
```

---

## 📝 Adding New Features

### 1. Add a New Function to Existing Module

**Example**: Add "Kill All Units" to Units module

**File**: `scripts/modules/units.js`

```javascript
const Units = {
    // ... existing functions ...
    
    // NEW FUNCTION
    killAllUnits() {
        if (!Vars.state.isGame()) return false;
        
        let count = 0;
        Groups.unit.each(unit => {
            unit.kill();
            count++;
        });
        
        Vars.ui.showInfoFade(I18n.format("killed-all-units", count));
        return true;
    }
};
```

**Add Translation** in `bundles/bundle.properties`:
```properties
hackdustry.killed-all-units = Killed {0} units
```

**Add to UI** in `scripts/ui/main-menu.js`:
```javascript
buildUnitsTab(content) {
    // ... existing buttons ...
    
    content.button(I18n.get("kill-all-units", "Kill All Units"), Icon.cancel, () => {
        UnitsModule.killAllUnits();
    }).fillX().height(60).row();
}
```

Done! ✅

---

### 2. Create a New Module

**Example**: Create a "Weather" module

**Step 1**: Create file `scripts/modules/weather.js`

```javascript
// Weather Module - Control game weather

const Weather = {
    // Set rain
    setRain(intensity) {
        if (!Vars.state.isGame()) return false;
        
        // Implementation here
        Vars.ui.showInfoFade(I18n.format("rain-set", intensity));
        return true;
    },
    
    // Clear weather
    clearWeather() {
        if (!Vars.state.isGame()) return false;
        
        // Implementation here
        Vars.ui.showInfoFade("@hackdustry.weather-cleared");
        return true;
    }
};

this.global.WeatherModule = Weather;
```

**Step 2**: Load in `main.js`

```javascript
// In main.js, add:
require("modules/weather");
```

**Step 3**: Add translations

```properties
# In bundle.properties
hackdustry.rain-set = Rain intensity set to {0}
hackdustry.weather-cleared = Weather cleared
```

**Step 4**: Add UI tab (optional)

```javascript
// In main-menu.js, add new tab:
this.createTab(tabs, "weather", Icon.weather);

// Add tab content:
buildWeatherTab(content) {
    content.add("[accent]Weather Control").row();
    
    content.button(I18n.get("set-rain", "Make Rain"), Icon.weather, () => {
        WeatherModule.setRain(1.0);
    }).fillX().height(60).row();
    
    content.button(I18n.get("clear-weather", "Clear Weather"), Icon.cancel, () => {
        WeatherModule.clearWeather();
    }).fillX().height(60).row();
}
```

Done! ✅

---

### 3. Create a Custom Block

**Example**: Create a "Teleporter" block

**Step 1**: Create content definition `content/blocks/teleporter.hjson`

```hjson
name: "[#00ffff]Teleporter [#ff0000][Hackdustry]"
type: Block
description: "Teleport player on click"
size: 2
health: 99999
configurable: true
alwaysUnlocked: true
category: effect
requirements: []
```

**Step 2**: Create script `scripts/blocks/teleporter.js`

```javascript
const teleporter = extend(Block, "teleporter", {});

teleporter.buildType = () => extend(Building, {
    updateTile() {
        this.health = Number.MAX_VALUE;
    },
    
    buildConfiguration(table) {
        table.button("Teleport", Styles.defaultt, () => {
            // Teleport player to this block
            Vars.player.set(this.x, this.y);
            Vars.ui.showInfoFade("Teleported!");
        }).size(150, 50);
    }
});

teleporter.update = true;
teleporter.configurable = true;
teleporter.health = 999999;
```

**Step 3**: Load in `main.js`

```javascript
require("blocks/teleporter");
```

Done! ✅

---

## 🌐 Adding Translations

### New Language

**Step 1**: Create `bundles/bundle_<locale>.properties`

Example for French: `bundle_fr.properties`

**Step 2**: Copy all strings from `bundle.properties`

**Step 3**: Translate each line:

```properties
# English
hackdustry.menu.title = Hackdustry Menu

# French
hackdustry.menu.title = Menu Hackdustry
```

**Step 4**: Done! Auto-detected by i18n system ✅

### Supported Locales

Common locale codes:
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ru` - Russian
- `zh` - Chinese
- `ja` - Japanese
- `ko` - Korean
- `ar` - Arabic
- `hi` - Hindi
- `nl` - Dutch
- `pl` - Polish
- `tr` - Turkish

---

## 🎨 Adding Icons & Sprites

### Mod Icon

**File**: `icon.png` (in root directory)
**Size**: 128x128 pixels
**Format**: PNG with transparency
**Design**: Green "H" with red/yellow accents

### Block Sprites

**Directory**: `sprites/blocks/`
**Naming**: `<block-name>.png` (e.g., `item-source.png`)
**Size**: 32x32 or 64x64 pixels
**Format**: PNG with transparency

Example structure:
```
sprites/
└── blocks/
    ├── item-source.png
    ├── power-source.png
    └── teleporter.png
```

---

## 🧪 Testing

### Local Testing

1. **Copy mod to Mindustry**
   ```bash
   cp -r hackdustry ~/Mindustry/mods/
   ```

2. **Launch Mindustry**

3. **Check console** for errors:
   - Look for `[Hackdustry]` logs
   - Check for JavaScript errors

4. **Test features** in-game:
   - Open menu (H button)
   - Test each module
   - Check translations

### Debug Mode

Add debug logging:

```javascript
// In any module
print("[Hackdustry Debug] Your message here");
```

View logs:
- **Android**: `/sdcard/Android/data/io.anuke.mindustry/files/last_log.txt`
- **PC**: `<Mindustry folder>/last_log.txt`

---

## 🔧 Common Patterns

### Checking if in Game

```javascript
if (!Vars.state.isGame()) {
    Vars.ui.showInfoFade("@hackdustry.not-in-game");
    return false;
}
```

### Getting Player Team

```javascript
const team = Vars.player.team();
const core = team.core();
```

### Iterating Entities

```javascript
// All units
Groups.unit.each(unit => {
    // Do something with unit
});

// All buildings
Groups.build.each(build => {
    // Do something with build
});

// All fire
Groups.fire.each(fire => {
    fire.remove();
});
```

### Showing Notifications

```javascript
// Simple message
Vars.ui.showInfoFade("Hello!");

// With translation
Vars.ui.showInfoFade(I18n.get("my-key", "Default"));

// With parameters
Vars.ui.showInfoFade(I18n.format("added-items", 100, "copper"));
```

### Creating Dialogs

```javascript
const dialog = new BaseDialog("My Dialog");

dialog.cont.add("Content here").row();

dialog.buttons.button("OK", () => {
    dialog.hide();
}).size(200, 60);

dialog.show();
```

---

## 📚 Useful APIs

### Vars Class (Global Variables)
```javascript
Vars.player      // Current player
Vars.state       // Game state
Vars.ui          // UI manager
Vars.content     // Content registry
Vars.world       // World instance
Vars.net         // Network state
```

### Groups (Entity Collections)
```javascript
Groups.unit      // All units
Groups.build     // All buildings
Groups.bullet    // All bullets
Groups.fire      // All fires
Groups.puddle    // All liquid puddles
```

### Content Access
```javascript
// Get item by name
Vars.content.item("copper")

// Get all items
Vars.content.items()

// Get block by name
Vars.content.block("router")

// Get unit by name
Vars.content.unit("dagger")
```

### Team Operations
```javascript
Team.sharded      // Team 0
Team.blue         // Team 1 (usually player)
Team.crux         // Team 2
// ... etc

team.core()       // Get team's core
team.data()       // Get team data
```

---

## 🐛 Debugging Tips

### Common Issues

**Module not loading**
- Check `require()` statement in main.js
- Check for syntax errors
- Look for missing export: `this.global.ModuleName`

**Function not found**
- Check module is loaded before use
- Check global export name matches usage
- Check typos in function names

**Translation not showing**
- Check key exists in bundle files
- Check locale format (`bundle_<locale>.properties`)
- Check I18n.get() usage

**Block not appearing**
- Check hjson syntax
- Check block is in `content/blocks/`
- Check script is loaded in main.js
- Check `alwaysUnlocked: true`

### Debug Checklist

✅ Check console for errors  
✅ Verify module loading order  
✅ Test in single-player first  
✅ Check file names match  
✅ Verify export statements  
✅ Test with vanilla Mindustry first  
✅ Check Mindustry version compatibility  

---

## 📖 Resources

### Mindustry Modding
- [Official Wiki](https://mindustrygame.github.io/wiki/modding/)
- [Modding Docs](https://github.com/Anuken/Mindustry/wiki/Modding)
- [Example Mods](https://github.com/Anuken/ExampleMod)

### JavaScript Resources
- [Rhino Engine](https://mozilla.github.io/rhino/) (Mindustry uses Rhino)
- [Java Interop](https://mozilla.github.io/rhino/tutorial.html)

### Community
- [Discord](https://discord.gg/mindustry)
- [Reddit](https://reddit.com/r/Mindustry)
- [GitHub Discussions](https://github.com/Anuken/Mindustry/discussions)

---

## 🎯 Contribution Guidelines

### Code Style

- Use camelCase for functions: `doSomething()`
- Use PascalCase for modules: `WeatherModule`
- Add comments for complex logic
- Keep functions focused and small
- Use meaningful variable names

### Git Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes
4. Test thoroughly
5. Commit: `git commit -m "Add: my feature"`
6. Push: `git push origin feature/my-feature`
7. Create Pull Request

### PR Guidelines

- **Title**: Clear and descriptive
- **Description**: What, why, and how
- **Testing**: How you tested it
- **Screenshots**: If UI changes

---

## 💡 Ideas for Contributions

### Easy
- Add new translations
- Fix typos in documentation
- Add block sprites
- Create mod icon

### Medium
- Add new cheat functions
- Improve UI design
- Add sound effects
- Create new blocks

### Hard
- Multiplayer support
- Plugin system
- Advanced AI control
- World editor integration

---

## 🙏 Thank You!

Every contribution helps make Hackdustry better for the community!

**Questions?** Feel free to ask in discussions or issues.

**Happy coding!** 🚀

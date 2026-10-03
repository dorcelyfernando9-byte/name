// Hackdustry - Advanced Cheat Menu Mod
// Main entry point

const Hackdustry = {
    version: "1.0.0",
    mod: null,
    settings: {},
    ui: null
};

// Initialize mod metadata
Events.on(ClientLoadEvent, () => {
    Hackdustry.mod = Vars.mods.locateMod("hackdustry");
    if (Hackdustry.mod) {
        Hackdustry.mod.meta.displayName = "[#00ff00]Hack[#ffff00]dustry [#ff0000]Menu";
        Hackdustry.mod.meta.author = "[accent]Hackdustry Team";
    }
    
    print("[Hackdustry] Initializing v" + Hackdustry.version);
    
    // Load modules
    try {
        require("utils/i18n");
        require("utils/settings");
        require("utils/item-detector");
        require("modules/resources");
        require("modules/acceleration");
        require("modules/units");
        require("modules/building");
        require("modules/research");
        require("modules/teleport");
        require("modules/vision");
        require("modules/player");
        require("modules/world");
        require("modules/music-player");
        require("ui/main-menu");
        require("blocks/item");
        require("blocks/power");
        require("blocks/liquid");
        require("blocks/command");
        require("blocks/turret");
        require("blocks/wall");
        
        print("[Hackdustry] All modules loaded successfully!");
        print("[Hackdustry] Press the menu button to access cheats");
    } catch (e) {
        print("[Hackdustry] Error loading modules: " + e);
    }
});

// Export for other modules
this.global.Hackdustry = Hackdustry;

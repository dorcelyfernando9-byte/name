// Hackdustry - Advanced Cheat Menu Mod
// Based on CheatMOD by paulieg626 / oleglysukhin (MPL-2.0)
// https://github.com/oleglysukhin/Cheat

const Hackdustry = {
    version: "1.1.0",
    mod: null,
    settings: {},
    ui: null
};

// Initialize mod metadata + load everything
Events.on(ClientLoadEvent, () => {
    Hackdustry.mod = Vars.mods.locateMod("hackdustry");
    if (Hackdustry.mod) {
        Hackdustry.mod.meta.displayName = "[#00ff00]Hack[#ffff00]dustry [#ff0000]Menu";
        Hackdustry.mod.meta.author = "[accent]Hackdustry Team[/accent] (blocks from paulieg626)";
    }

    print("[Hackdustry] Initializing v" + Hackdustry.version);

    try {
        // Utils
        require("utils/i18n");
        require("utils/settings");
        require("utils/item-detector");

        // Menu modules (Hackdustry extras)
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

        // Cheat blocks (from oleglysukhin/Cheat)
        require("blocks/liquid");
        require("blocks/power");
        require("blocks/wall");
        require("blocks/turret");
        require("blocks/value");
        require("blocks/magic");
        require("blocks/conv");
        require("blocks/shield");
        require("blocks/boost");
        require("blocks/cc");
        require("blocks/item");
        require("blocks/skip");
        require("blocks/command");

        // Init UI here (NOT inside another ClientLoadEvent — that event already fired)
        if (typeof MusicPlayerModule !== "undefined") {
            MusicPlayerModule.init();
            MusicPlayerModule.volume = HackdustrySettings.getFloat("music_volume", 0.5);
        }
        if (typeof MainMenu !== "undefined") {
            MainMenu.init();
        }

        print("[Hackdustry] All modules + Cheat blocks loaded!");
        print("[Hackdustry] Tap the green H button for the menu");
    } catch (e) {
        print("[Hackdustry] Error loading modules: " + e);
    }
});

this.global.Hackdustry = Hackdustry;

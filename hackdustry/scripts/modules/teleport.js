// Teleport Module - Player teleportation

const Teleport = {
    savedPositions: [],
    
    init() {
        const saved = HackdustrySettings.get("saved_positions", "[]");
        try {
            this.savedPositions = JSON.parse(saved);
        } catch (e) {
            this.savedPositions = [];
        }
    },
    
    // Teleport to coordinates
    teleportTo(x, y) {
        if (!Vars.state.isGame()) {
            Vars.ui.showInfoFade("@hackdustry.not-in-game");
            return false;
        }
        
        Vars.player.set(x, y);
        Vars.ui.showInfoFade(I18n.format("teleported", Math.floor(x), Math.floor(y)));
        return true;
    },
    
    // Teleport to core
    teleportToCore() {
        if (!Vars.state.isGame()) return false;
        
        const core = Vars.player.team().core();
        if (!core) {
            Vars.ui.showInfoFade("@hackdustry.no-core");
            return false;
        }
        
        this.teleportTo(core.x, core.y);
        return true;
    },
    
    // Teleport to enemy core
    teleportToEnemyCore() {
        if (!Vars.state.isGame()) return false;
        
        let enemyCore = null;
        Groups.build.each(build => {
            if (build.team !== Vars.player.team() && build.block.name.contains("core")) {
                enemyCore = build;
            }
        });
        
        if (!enemyCore) {
            Vars.ui.showInfoFade("@hackdustry.no-enemy-core");
            return false;
        }
        
        this.teleportTo(enemyCore.x, enemyCore.y);
        return true;
    },
    
    // Save current position
    savePosition(name) {
        if (!Vars.state.isGame()) return false;
        
        const pos = {
            name: name,
            x: Vars.player.x,
            y: Vars.player.y,
            mapName: Vars.state.map.name()
        };
        
        this.savedPositions.push(pos);
        HackdustrySettings.set("saved_positions", JSON.stringify(this.savedPositions));
        
        Vars.ui.showInfoFade(I18n.format("position-saved", name));
        return true;
    },
    
    // Load saved position
    loadPosition(name) {
        if (!Vars.state.isGame()) return false;
        
        const pos = this.savedPositions.find(p => p.name === name);
        if (!pos) {
            Vars.ui.showInfoFade(I18n.format("position-not-found", name));
            return false;
        }
        
        this.teleportTo(pos.x, pos.y);
        return true;
    },
    
    // Delete saved position
    deletePosition(name) {
        this.savedPositions = this.savedPositions.filter(p => p.name !== name);
        HackdustrySettings.set("saved_positions", JSON.stringify(this.savedPositions));
        return true;
    }
};

Teleport.init();

this.global.TeleportModule = Teleport;

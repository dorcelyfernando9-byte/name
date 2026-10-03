// Building Module - Construction and deconstruction cheats

const Building = {
    // Instant build all
    instantBuildAll() {
        if (!Vars.state.isGame()) return false;
        
        const team = Vars.player.team();
        let count = 0;
        
        Groups.build.each(build => {
            if (build.team === team && build.buildCost() > 0) {
                while (build.progress() < 1) {
                    build.progress(build.progress() + 0.01);
                }
                count++;
            }
        });
        
        Vars.ui.showInfoFade(I18n.format("built-all", count));
        return true;
    },
    
    // Destroy all enemy buildings
    destroyEnemyBuildings() {
        if (!Vars.state.isGame()) return false;
        
        const team = Vars.player.team();
        let count = 0;
        
        Groups.build.each(build => {
            if (build.team !== team) {
                build.kill();
                count++;
            }
        });
        
        Vars.ui.showInfoFade(I18n.format("destroyed-enemies", count));
        return true;
    },
    
    // Heal all buildings
    healAllBuildings() {
        if (!Vars.state.isGame()) return false;
        
        const team = Vars.player.team();
        let count = 0;
        
        Groups.build.each(build => {
            if (build.team === team) {
                build.health = build.maxHealth();
                count++;
            }
        });
        
        Vars.ui.showInfoFade(I18n.format("healed-buildings", count));
        return true;
    },
    
    // Infinite building range
    infiniteRange(enable) {
        if (!Vars.state.isGame()) return false;
        
        if (enable) {
            Vars.state.rules.infiniteResources = true;
            Vars.player.buildSpeedMultiplier = 100;
            Vars.ui.showInfoFade("@hackdustry.infinite-range-on");
        } else {
            Vars.state.rules.infiniteResources = false;
            Vars.player.buildSpeedMultiplier = 1;
            Vars.ui.showInfoFade("@hackdustry.infinite-range-off");
        }
        return true;
    },
    
    // Free building (no resources needed)
    freeBuilding(enable) {
        if (!Vars.state.isGame()) return false;
        
        Vars.state.rules.infiniteResources = enable;
        Vars.ui.showInfoFade(enable ? "@hackdustry.free-build-on" : "@hackdustry.free-build-off");
        return true;
    }
};

this.global.BuildingModule = Building;

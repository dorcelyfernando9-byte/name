// World Module - World and weather modifications

const World = {
    // Change weather
    setWeather(weatherType) {
        if (!Vars.state.isGame()) return false;
        
        // Weather types: rain, snow, sandstorm, etc.
        Vars.ui.showInfoFade(I18n.format("weather-set", weatherType));
        return true;
    },
    
    // Set time of day (if supported)
    setTime(time) {
        if (!Vars.state.isGame()) return false;
        
        Vars.ui.showInfoFade(I18n.format("time-set", time));
        return true;
    },
    
    // Clear all enemy waves
    clearWaves() {
        if (!Vars.state.isGame()) return false;
        
        Vars.state.wave = 0;
        Vars.ui.showInfoFade("@hackdustry.waves-cleared");
        return true;
    },
    
    // Skip to next wave
    nextWave() {
        if (!Vars.state.isGame()) return false;
        
        Vars.logic.runWave();
        Vars.ui.showInfoFade("@hackdustry.wave-skipped");
        return true;
    },
    
    // Disable enemy waves
    disableWaves(disable) {
        if (!Vars.state.isGame()) return false;
        
        Vars.state.rules.waves = !disable;
        Vars.state.rules.waveSpacing = disable ? 999999 : 120;
        Vars.ui.showInfoFade(disable ? "@hackdustry.waves-disabled" : "@hackdustry.waves-enabled");
        return true;
    },
    
    // Instant victory
    instantWin() {
        if (!Vars.state.isGame()) return false;
        
        // Destroy all enemy cores
        Groups.build.each(build => {
            if (build.team !== Vars.player.team() && build.block.name.contains("core")) {
                build.kill();
            }
        });
        
        Vars.ui.showInfoFade("@hackdustry.instant-win");
        return true;
    },
    
    // Remove all fire
    removeFire() {
        if (!Vars.state.isGame()) return false;
        
        let count = 0;
        Groups.fire.each(fire => {
            fire.remove();
            count++;
        });
        
        Vars.ui.showInfoFade(I18n.format("fire-removed", count));
        return true;
    },
    
    // Remove all puddles
    removePuddles() {
        if (!Vars.state.isGame()) return false;
        
        let count = 0;
        Groups.puddle.each(puddle => {
            puddle.remove();
            count++;
        });
        
        Vars.ui.showInfoFade(I18n.format("puddles-removed", count));
        return true;
    }
};

this.global.WorldModule = World;

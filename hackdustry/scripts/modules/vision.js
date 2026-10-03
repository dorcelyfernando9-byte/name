// Vision Module - FOW and vision cheats

const Vision = {
    // Reveal entire map
    revealMap(enable) {
        if (!Vars.state.isGame()) return false;
        
        Vars.state.rules.fog = !enable;
        Vars.ui.showInfoFade(enable ? "@hackdustry.fog-disabled" : "@hackdustry.fog-enabled");
        return true;
    },
    
    // Show enemy units
    showEnemyUnits(enable) {
        if (!Vars.state.isGame()) return false;
        
        Vars.state.rules.enemyLights = enable;
        Vars.ui.showInfoFade(enable ? "@hackdustry.enemy-visible" : "@hackdustry.enemy-hidden");
        return true;
    },
    
    // Reveal entire tech tree
    revealTechTree() {
        Vars.state.rules.revealedBlocks.addAll(Vars.content.blocks());
        Vars.ui.showInfoFade("@hackdustry.tech-revealed");
        return true;
    }
};

this.global.VisionModule = Vision;

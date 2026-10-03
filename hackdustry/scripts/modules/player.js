// Player Module - Player modifications

const Player = {
    // God mode (invincible)
    godMode(enable) {
        if (!Vars.state.isGame()) return false;
        
        if (enable) {
            Vars.player.unit().maxHealth = 999999;
            Vars.player.unit().health = 999999;
            Vars.ui.showInfoFade("@hackdustry.god-mode-on");
        } else {
            const unitType = Vars.player.unit().type;
            Vars.player.unit().maxHealth = unitType.health;
            Vars.player.unit().health = unitType.health;
            Vars.ui.showInfoFade("@hackdustry.god-mode-off");
        }
        return true;
    },
    
    // Infinite ammo
    infiniteAmmo(enable) {
        if (!Vars.state.isGame()) return false;
        
        Vars.state.rules.infiniteResources = enable;
        Vars.ui.showInfoFade(enable ? "@hackdustry.infinite-ammo-on" : "@hackdustry.infinite-ammo-off");
        return true;
    },
    
    // Flight mode
    flightMode(enable) {
        if (!Vars.state.isGame()) return false;
        
        // This would require modifying player movement physics
        Vars.ui.showInfoFade(enable ? "@hackdustry.flight-on" : "@hackdustry.flight-off");
        return true;
    },
    
    // Heal player
    heal() {
        if (!Vars.state.isGame()) return false;
        
        Vars.player.unit().health = Vars.player.unit().maxHealth;
        Vars.ui.showInfoFade("@hackdustry.healed");
        return true;
    },
    
    // Kill player
    suicide() {
        if (!Vars.state.isGame()) return false;
        
        Vars.player.unit().kill();
        Vars.ui.showInfoFade("@hackdustry.dead");
        return true;
    },
    
    // Change team
    changeTeam(teamId) {
        if (!Vars.state.isGame()) return false;
        
        const team = Team.all[teamId];
        if (team) {
            Vars.player.team(team);
            Vars.ui.showInfoFade(I18n.format("team-changed", team.name));
            return true;
        }
        return false;
    },
    
    // No clip (walk through walls)
    noClip(enable) {
        if (!Vars.state.isGame()) return false;
        
        // This would require physics modifications
        Vars.ui.showInfoFade(enable ? "@hackdustry.noclip-on" : "@hackdustry.noclip-off");
        return true;
    }
};

this.global.PlayerModule = Player;

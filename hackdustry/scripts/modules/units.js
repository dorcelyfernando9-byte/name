// Units Module - Spawn and control units

const Units = {
    // Spawn unit at player position
    spawnUnit(unitName, amount) {
        if (!Vars.state.isGame()) {
            Vars.ui.showInfoFade("@hackdustry.not-in-game");
            return false;
        }
        
        const unitData = ItemDetector.getUnit(unitName);
        if (!unitData) {
            Vars.ui.showInfoFade(I18n.format("unit-not-found", unitName));
            return false;
        }
        
        const player = Vars.player;
        const team = player.team();
        
        for (let i = 0; i < amount; i++) {
            const unit = unitData.unit.spawn(team, player.x, player.y);
            if (unit) {
                unit.health = unit.maxHealth;
            }
        }
        
        Vars.ui.showInfoFade(I18n.format("spawned-units", amount, unitData.localizedName));
        return true;
    },
    
    // Spawn all units
    spawnAllUnits() {
        if (!Vars.state.isGame()) return false;
        
        const player = Vars.player;
        const team = player.team();
        let count = 0;
        
        ItemDetector.allUnits.forEach((unitData, index) => {
            const angle = (index / ItemDetector.allUnits.length) * 360;
            const dist = 100;
            const x = player.x + Mathf.cosDeg(angle) * dist;
            const y = player.y + Mathf.sinDeg(angle) * dist;
            
            const unit = unitData.unit.spawn(team, x, y);
            if (unit) {
                unit.health = unit.maxHealth;
                count++;
            }
        });
        
        Vars.ui.showInfoFade(I18n.format("spawned-all-units", count));
        return true;
    },
    
    // Kill all enemy units
    killEnemies() {
        if (!Vars.state.isGame()) return false;
        
        const playerTeam = Vars.player.team();
        let count = 0;
        
        Groups.unit.each(unit => {
            if (unit.team !== playerTeam) {
                unit.kill();
                count++;
            }
        });
        
        Vars.ui.showInfoFade(I18n.format("killed-enemies", count));
        return true;
    },
    
    // Heal all friendly units
    healAllies() {
        if (!Vars.state.isGame()) return false;
        
        const playerTeam = Vars.player.team();
        let count = 0;
        
        Groups.unit.each(unit => {
            if (unit.team === playerTeam) {
                unit.health = unit.maxHealth;
                count++;
            }
        });
        
        Vars.ui.showInfoFade(I18n.format("healed-allies", count));
        return true;
    },
    
    // Make units invincible
    makeInvincible(enable) {
        if (!Vars.state.isGame()) return false;
        
        if (enable) {
            Vars.state.rules.unitHealthMultiplier = 1000;
            Vars.ui.showInfoFade("@hackdustry.invincible-on");
        } else {
            Vars.state.rules.unitHealthMultiplier = 1;
            Vars.ui.showInfoFade("@hackdustry.invincible-off");
        }
        return true;
    }
};

this.global.UnitsModule = Units;

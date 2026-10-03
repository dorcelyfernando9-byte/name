// Acceleration Module - Time and speed manipulation

const Acceleration = {
    originalSpeed: 1.0,
    isSpeedModified: false,
    
    // Set game speed multiplier
    setGameSpeed(multiplier) {
        if (!Vars.state.isGame()) {
            Vars.ui.showInfoFade("@hackdustry.not-in-game");
            return false;
        }
        
        Time.setDeltaProvider(() => {
            return Math.min(Core.graphics.getDeltaTime() * 60 * multiplier, 3 * multiplier);
        });
        
        this.isSpeedModified = true;
        Vars.ui.showInfoFade(I18n.format("speed-set", multiplier + "x"));
        return true;
    },
    
    // Reset to normal speed
    resetSpeed() {
        Time.setDeltaProvider(() => {
            return Math.min(Core.graphics.getDeltaTime() * 60, 3);
        });
        
        this.isSpeedModified = false;
        Vars.ui.showInfoFade("@hackdustry.speed-reset");
        return true;
    },
    
    // Instant building
    enableInstantBuild(enable) {
        if (!Vars.state.isGame()) return false;
        
        if (enable) {
            Vars.state.rules.buildSpeedMultiplier = 1000;
            Vars.state.rules.blockHealthMultiplier = 1000;
            Vars.ui.showInfoFade("@hackdustry.instant-build-on");
        } else {
            Vars.state.rules.buildSpeedMultiplier = 1;
            Vars.state.rules.blockHealthMultiplier = 1;
            Vars.ui.showInfoFade("@hackdustry.instant-build-off");
        }
        return true;
    },
    
    // Unit speed boost
    boostUnitSpeed(enable) {
        if (!Vars.state.isGame()) return false;
        
        if (enable) {
            Vars.state.rules.unitBuildSpeedMultiplier = 100;
            Vars.ui.showInfoFade("@hackdustry.unit-speed-on");
        } else {
            Vars.state.rules.unitBuildSpeedMultiplier = 1;
            Vars.ui.showInfoFade("@hackdustry.unit-speed-off");
        }
        return true;
    }
};

this.global.AccelerationModule = Acceleration;

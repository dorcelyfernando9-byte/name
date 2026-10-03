// Liquid Source Block - Infinite liquid generation

const liquidSource = extend(LiquidSource, "liquid-source", {});

liquidSource.buildType = () => extend(LiquidSource.LiquidSourceBuild, liquidSource, {
    updateTile() {
        this.super$updateTile();
        this.health = Number.MAX_VALUE;
    }
});

liquidSource.update = true;
liquidSource.health = 999999999;

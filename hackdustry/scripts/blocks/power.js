// Power Source Block - Infinite power generation

const powerSource = extend(PowerNode, "power-source", {
    outputsPower: true,
    consumesPower: false,
    hasPower: true
});

powerSource.buildType = () => extend(PowerNode.PowerNodeBuild, powerSource, {
    updateTile() {
        this.super$updateTile();
        this.health = Number.MAX_VALUE;
        
        if (this.power) {
            this.power.status = 1.0;
            this.power.graph.each(node => {
                if (node.power) {
                    node.power.status = 1.0;
                }
            });
        }
    },
    
    getPowerProduction() {
        return 999999;
    }
});

powerSource.update = true;
powerSource.health = 999999999;

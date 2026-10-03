// Super Turret Block - Overpowered turret

const superTurret = extend(ItemTurret, "super-turret", {});

superTurret.buildType = () => extend(ItemTurret.ItemTurretBuild, superTurret, {
    updateTile() {
        this.super$updateTile();
        this.health = Number.MAX_VALUE;
        
        // Infinite ammo
        if (this.items) {
            Vars.content.items().each(item => {
                this.items.set(item, 1000);
            });
        }
    }
});

superTurret.update = true;
superTurret.health = 999999999;

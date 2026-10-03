// Invincible Wall Block - Cannot be destroyed

const invincibleWall = extend(Wall, "invincible-wall", {});

invincibleWall.buildType = () => extend(Wall.WallBuild, invincibleWall, {
    updateTile() {
        this.super$updateTile();
        this.health = Number.MAX_VALUE;
    },
    
    damage(amount) {
        // Override damage to make it invincible
        return;
    }
});

invincibleWall.update = true;
invincibleWall.health = 999999999;

// Item Source Block - Infinite item generation

const itemSource = extend(ItemSource, "item-source", {});

itemSource.buildType = () => extend(ItemSource.ItemSourceBuild, itemSource, {
    updateTile() {
        this.super$updateTile();
        this.health = Number.MAX_VALUE;
    }
});

itemSource.update = true;
itemSource.health = 999999999;

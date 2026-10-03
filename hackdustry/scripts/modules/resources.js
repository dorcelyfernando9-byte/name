// Resources Module - Add items and liquids to core

const Resources = {
    // Add items to core
    addItem(itemName, amount) {
        if (!Vars.state.isGame()) {
            Vars.ui.showInfoFade("@hackdustry.not-in-game");
            return false;
        }
        
        const itemData = ItemDetector.getItem(itemName);
        if (!itemData) {
            Vars.ui.showInfoFade(I18n.format("item-not-found", itemName));
            return false;
        }
        
        const team = Vars.player.team();
        const core = team.core();
        
        if (!core) {
            Vars.ui.showInfoFade("@hackdustry.no-core");
            return false;
        }
        
        core.items.add(itemData.item, amount);
        Vars.ui.showInfoFade(I18n.format("added-items", amount, itemData.localizedName));
        return true;
    },
    
    // Add all items
    addAllItems(amount) {
        if (!Vars.state.isGame()) return false;
        
        const team = Vars.player.team();
        const core = team.core();
        
        if (!core) {
            Vars.ui.showInfoFade("@hackdustry.no-core");
            return false;
        }
        
        ItemDetector.allItems.forEach(itemData => {
            core.items.add(itemData.item, amount);
        });
        
        Vars.ui.showInfoFade(I18n.format("added-all-items", amount));
        return true;
    },
    
    // Fill core to maximum
    fillCore() {
        if (!Vars.state.isGame()) return false;
        
        const team = Vars.player.team();
        const core = team.core();
        
        if (!core) {
            Vars.ui.showInfoFade("@hackdustry.no-core");
            return false;
        }
        
        const maxAmount = 1000000;
        ItemDetector.allItems.forEach(itemData => {
            core.items.set(itemData.item, maxAmount);
        });
        
        Vars.ui.showInfoFade("@hackdustry.core-filled");
        return true;
    },
    
    clearItems() {
        if (!Vars.state.isGame()) return false;
        const team = Vars.player.team();
        const core = team.core();
        if (!core) return false;
        core.items.clear();
        Vars.ui.showInfoFade("@hackdustry.items-cleared");
        return true;
    }
};

this.global.ResourcesModule = Resources;

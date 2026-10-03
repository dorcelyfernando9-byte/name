// Item Detector - Automatically detect items from all mods (vanilla + modded)

const ItemDetector = {
    allItems: [],
    allLiquids: [],
    allUnits: [],
    
    // Scan all content
    scan() {
        print("[Hackdustry] Scanning for items, liquids, and units...");
        
        // Get all items (vanilla + modded)
        this.allItems = [];
        Vars.content.items().each(item => {
            this.allItems.push({
                name: item.name,
                localizedName: item.localizedName,
                emoji: item.emoji(),
                color: item.color,
                item: item,
                modName: this.getModName(item)
            });
        });
        
        // Get all liquids
        this.allLiquids = [];
        Vars.content.liquids().each(liquid => {
            this.allLiquids.push({
                name: liquid.name,
                localizedName: liquid.localizedName,
                color: liquid.color,
                liquid: liquid,
                modName: this.getModName(liquid)
            });
        });
        
        // Get all units
        this.allUnits = [];
        Vars.content.units().each(unit => {
            this.allUnits.push({
                name: unit.name,
                localizedName: unit.localizedName,
                emoji: unit.emoji,
                unit: unit,
                modName: this.getModName(unit)
            });
        });
        
        print("[Hackdustry] Found " + this.allItems.length + " items, " + 
              this.allLiquids.length + " liquids, " + 
              this.allUnits.length + " units");
    },
    
    // Get mod name from content
    getModName(content) {
        try {
            if (content.minfo && content.minfo.mod) {
                return content.minfo.mod.name;
            }
        } catch (e) {}
        return "vanilla";
    },
    
    // Search items by name
    searchItems(query) {
        query = query.toLowerCase();
        return this.allItems.filter(item => 
            item.name.toLowerCase().includes(query) || 
            item.localizedName.toLowerCase().includes(query)
        );
    },
    
    // Get item by name
    getItem(name) {
        return this.allItems.find(i => 
            i.name === name || 
            i.localizedName.toLowerCase() === name.toLowerCase()
        );
    },
    
    // Get liquid by name
    getLiquid(name) {
        return this.allLiquids.find(l => 
            l.name === name || 
            l.localizedName.toLowerCase() === name.toLowerCase()
        );
    },
    
    // Get unit by name
    getUnit(name) {
        return this.allUnits.find(u => 
            u.name === name || 
            u.localizedName.toLowerCase() === name.toLowerCase()
        );
    }
};

// Scan on load
Events.on(ContentInitEvent, () => {
    ItemDetector.scan();
});

// Export
this.global.ItemDetector = ItemDetector;

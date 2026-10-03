// Settings Manager - Save and load user preferences

const Settings = {
    prefix: "hackdustry_",
    
    // Save a setting
    set(key, value) {
        Core.settings.put(this.prefix + key, value);
    },
    
    // Get a setting
    get(key, defaultValue) {
        return Core.settings.get(this.prefix + key, defaultValue);
    },
    
    // Get boolean setting
    getBool(key, defaultValue) {
        return Core.settings.getBool(this.prefix + key, defaultValue);
    },
    
    // Get integer setting
    getInt(key, defaultValue) {
        return Core.settings.getInt(this.prefix + key, defaultValue);
    },
    
    // Get float setting
    getFloat(key, defaultValue) {
        return Core.settings.getFloat(this.prefix + key, defaultValue);
    },
    
    // Save favorites
    saveFavorites(favorites) {
        this.set("favorites", JSON.stringify(favorites));
    },
    
    // Load favorites
    loadFavorites() {
        try {
            const data = this.get("favorites", "[]");
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    },
    
    // Save menu position
    saveMenuPosition(x, y) {
        this.set("menu_x", x);
        this.set("menu_y", y);
    },
    
    // Load menu position
    loadMenuPosition() {
        return {
            x: this.getFloat("menu_x", 100),
            y: this.getFloat("menu_y", 100)
        };
    }
};

// Export
this.global.HackdustrySettings = Settings;

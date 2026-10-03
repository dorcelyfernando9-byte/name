// i18n - Internationalization system
// Supports 30+ languages

const I18n = {
    currentLocale: "en",
    
    init() {
        // Detect game language
        this.currentLocale = Core.settings.getString("locale", "en");
        print("[Hackdustry] Language set to: " + this.currentLocale);
    },
    
    // Get translated string
    get(key, defaultValue) {
        const bundleKey = "hackdustry." + key;
        if (Core.bundle.has(bundleKey)) {
            return Core.bundle.get(bundleKey);
        }
        return defaultValue || key;
    },
    
    // Format string with parameters
    format(key, ...args) {
        let text = this.get(key);
        args.forEach((arg, i) => {
            text = text.replace("{" + i + "}", arg);
        });
        return text;
    }
};

I18n.init();

// Export
this.global.I18n = I18n;

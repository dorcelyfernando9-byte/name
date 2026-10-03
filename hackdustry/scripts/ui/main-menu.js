// Main Menu UI - Draggable floating button with expandable menu

const MainMenu = {
    dialog: null,
    button: null,
    buttonX: 100,
    buttonY: 100,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    searchQuery: "",
    currentTab: "resources",
    favorites: [],
    
    init() {
        this.loadPosition();
        this.createFloatingButton();
        this.createMainDialog();
        this.favorites = HackdustrySettings.loadFavorites();
    },
    
    // Create draggable floating button
    createFloatingButton() {
        const ui = new Table();
        ui.setFillParent(true);
        ui.top().left();
        
        const button = ui.button("[#00ff00]H", Styles.defaultt, () => {
            if (!this.isDragging) {
                this.showMenu();
            }
        }).size(60).get();
        
        button.setColor(Color.valueOf("00ff0088"));
        
        // Make button draggable (mobile-friendly)
        button.addListener(new InputListener({
            touchDown(event, x, y, pointer, btn) {
                MainMenu.isDragging = false;
                MainMenu.dragStartX = x;
                MainMenu.dragStartY = y;
                return true;
            },
            
            touchDragged(event, x, y, pointer) {
                const deltaX = x - MainMenu.dragStartX;
                const deltaY = y - MainMenu.dragStartY;
                
                // Check if moved enough to be considered dragging
                if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                    MainMenu.isDragging = true;
                    MainMenu.buttonX += deltaX;
                    MainMenu.buttonY -= deltaY; // Inverted Y
                    
                    // Clamp to screen bounds
                    MainMenu.buttonX = Mathf.clamp(MainMenu.buttonX, 0, Core.graphics.getWidth() - 60);
                    MainMenu.buttonY = Mathf.clamp(MainMenu.buttonY, 0, Core.graphics.getHeight() - 60);
                    
                    button.setPosition(MainMenu.buttonX, Core.graphics.getHeight() - MainMenu.buttonY - 60);
                }
            },
            
            touchUp(event, x, y, pointer, btn) {
                if (MainMenu.isDragging) {
                    MainMenu.savePosition();
                    MainMenu.isDragging = false;
                }
            }
        }));
        
        button.setPosition(this.buttonX, Core.graphics.getHeight() - this.buttonY - 60);
        
        // Update position on screen resize
        Events.run(Trigger.update, () => {
            if (!MainMenu.isDragging) {
                button.setPosition(MainMenu.buttonX, Core.graphics.getHeight() - MainMenu.buttonY - 60);
            }
        });
        
        Core.scene.add(ui);
        this.button = button;
    },
    
    // Create main menu dialog
    createMainDialog() {
        this.dialog = new BaseDialog(I18n.get("menu.title", "Hackdustry Menu"));
        this.dialog.setFillParent(true);
        
        const cont = this.dialog.cont;
        
        // Search bar
        cont.table(search => {
            search.image(Icon.zoom).size(40).padRight(10);
            const field = search.field(this.searchQuery, text => {
                this.searchQuery = text;
                this.refreshContent();
            }).width(400).get();
            field.setMessageText(I18n.get("search", "Search..."));
        }).fillX().padBottom(10).row();
        
        // Tabs
        cont.table(tabs => {
            this.createTab(tabs, "resources", Icon.itemCopper);
            this.createTab(tabs, "acceleration", Icon.upgrade);
            this.createTab(tabs, "units", Icon.units);
            this.createTab(tabs, "building", Icon.blocks);
            this.createTab(tabs, "research", Icon.tree);
            this.createTab(tabs, "teleport", Icon.move);
            this.createTab(tabs, "vision", Icon.eye);
            this.createTab(tabs, "player", Icon.admin);
            this.createTab(tabs, "world", Icon.terrain);
            this.createTab(tabs, "favorites", Icon.star);
        }).fillX().height(70).padBottom(10).row();
        
        // Content area (scrollable)
        const pane = new ScrollPane(new Table());
        cont.add(pane).grow().row();
        this.contentPane = pane;
        
        // Close button
        this.dialog.buttons.button("@close", Icon.cancel, () => {
            this.dialog.hide();
        }).size(200, 60);
        
        this.refreshContent();
    },
    
    createTab(table, name, icon) {
        table.button(icon, Styles.clearTogglei, 50, () => {
            this.currentTab = name;
            this.refreshContent();
        }).checked(b => this.currentTab === name).tooltip(I18n.get("tab." + name));
    },
    
    refreshContent() {
        const content = new Table();
        
        switch(this.currentTab) {
            case "resources":
                this.buildResourcesTab(content);
                break;
            case "acceleration":
                this.buildAccelerationTab(content);
                break;
            case "units":
                this.buildUnitsTab(content);
                break;
            case "building":
                this.buildBuildingTab(content);
                break;
            case "research":
                this.buildResearchTab(content);
                break;
            case "teleport":
                this.buildTeleportTab(content);
                break;
            case "vision":
                this.buildVisionTab(content);
                break;
            case "player":
                this.buildPlayerTab(content);
                break;
            case "world":
                this.buildWorldTab(content);
                break;
            case "favorites":
                this.buildFavoritesTab(content);
                break;
        }
        
        this.contentPane.setWidget(content);
    },
    
    buildResourcesTab(content) {
        content.add(I18n.get("tab.resources.title", "Resources")).color(Color.accent).row();
        
        // Quick add items input
        content.table(t => {
            t.add(I18n.get("item-name", "Item:")).padRight(10);
            const itemField = t.field("", text => {}).width(200).get();
            itemField.setMessageText("copper");
            
            t.add(I18n.get("amount", "Amount:")).padLeft(10).padRight(10);
            const amountField = t.field("1000", text => {}).width(150).get();
            
            t.button(I18n.get("add", "Add"), Icon.add, () => {
                const itemName = itemField.getText();
                const amount = parseInt(amountField.getText()) || 1000;
                ResourcesModule.addItem(itemName, amount);
            }).width(150).height(50);
        }).fillX().padBottom(10).row();
        
        // Quick actions
        content.button(I18n.get("fill-core", "Fill Core (1M each)"), Icon.upload, () => {
            ResourcesModule.fillCore();
        }).fillX().height(60).padBottom(5).row();
        
        content.button(I18n.get("add-all-10k", "Add All Items (10k)"), Icon.add, () => {
            ResourcesModule.addAllItems(10000);
        }).fillX().height(60).padBottom(5).row();
        
        content.button(I18n.get("clear-items", "Clear All Items"), Icon.trash, () => {
            ResourcesModule.clearItems();
        }).fillX().height(60).row();
    },
    
    buildAccelerationTab(content) {
        content.add("[accent]Acceleration").row();
        content.add("Coming soon...").padTop(20);
    },
    
    buildUnitsTab(content) {
        content.add("[accent]Units").row();
        content.add("Coming soon...").padTop(20);
    },
    
    buildBuildingTab(content) {
        content.add("[accent]Building").row();
        content.add("Coming soon...").padTop(20);
    },
    
    buildResearchTab(content) {
        content.add("[accent]Research").row();
        content.add("Coming soon...").padTop(20);
    },
    
    buildTeleportTab(content) {
        content.add("[accent]Teleport").row();
        content.add("Coming soon...").padTop(20);
    },
    
    buildVisionTab(content) {
        content.add("[accent]Vision").row();
        content.add("Coming soon...").padTop(20);
    },
    
    buildPlayerTab(content) {
        content.add("[accent]Player").row();
        content.add("Coming soon...").padTop(20);
    },
    
    buildWorldTab(content) {
        content.add("[accent]World").row();
        content.add("Coming soon...").padTop(20);
    },
    
    buildFavoritesTab(content) {
        content.add("[accent]Favorites").row();
        if (this.favorites.length === 0) {
            content.add("No favorites yet").padTop(20);
        }
    },
    
    showMenu() {
        this.refreshContent();
        this.dialog.show();
    },
    
    loadPosition() {
        const pos = HackdustrySettings.loadMenuPosition();
        this.buttonX = pos.x;
        this.buttonY = pos.y;
    },
    
    savePosition() {
        HackdustrySettings.saveMenuPosition(this.buttonX, this.buttonY);
    }
};

// Initialize on client load
Events.on(ClientLoadEvent, () => {
    MainMenu.init();
});

this.global.MainMenu = MainMenu;

// Main Menu UI - Floating draggable "H" button (mobile + PC)

const MainMenu = {
    dialog: null,
    table: null,
    button: null,
    buttonX: 20,
    buttonY: 200,
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    searchQuery: "",
    currentTab: "resources",
    favorites: [],
    btnSize: 56,

    init() {
        try {
            this.loadPosition();
            this.createFloatingButton();
            this.createMainDialog();
            this.favorites = HackdustrySettings.loadFavorites();
            print("[Hackdustry] Floating menu button ready");
        } catch (e) {
            print("[Hackdustry] UI init error: " + e);
        }
    },

    // Small floating table (NOT fillParent — that blocks the whole screen on mobile)
    createFloatingButton() {
        const size = this.btnSize;
        const table = new Table();
        table.touchable = Touchable.enabled;

        const button = table.button("[#00ff00]H", Styles.defaultt, () => {
            // Open handled in touchUp so mobile + PC behave the same
        }).size(size, size).get();

        button.setColor(Color.valueOf("00ff00aa"));

        // Rhino needs extend(InputListener), not new InputListener({...})
        button.addListener(extend(InputListener, {
            touchDown(event, x, y, pointer, btn) {
                MainMenu.isDragging = false;
                MainMenu.dragOffsetX = x;
                MainMenu.dragOffsetY = y;
                // Bring to front while dragging
                table.toFront();
                return true; // capture touch (needed for drag on mobile)
            },

            touchDragged(event, x, y, pointer) {
                const dx = x - MainMenu.dragOffsetX;
                const dy = y - MainMenu.dragOffsetY;

                if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                    MainMenu.isDragging = true;
                }

                if (MainMenu.isDragging) {
                    let nx = table.x + dx;
                    let ny = table.y + dy;

                    const w = Core.graphics.getWidth();
                    const h = Core.graphics.getHeight();
                    nx = Mathf.clamp(nx, 0, w - size);
                    ny = Mathf.clamp(ny, 0, h - size);

                    table.setPosition(nx, ny);
                    MainMenu.buttonX = nx;
                    MainMenu.buttonY = ny;
                }
            },

            touchUp(event, x, y, pointer, btn) {
                if (MainMenu.isDragging) {
                    MainMenu.savePosition();
                    MainMenu.isDragging = false;
                } else {
                    // Tap without drag → open menu (works on Android)
                    MainMenu.showMenu();
                }
            }
        }));

        // Place near left side, mid-height (safe on phones)
        const w = Core.graphics.getWidth();
        const h = Core.graphics.getHeight();
        this.buttonX = Mathf.clamp(this.buttonX, 0, Math.max(0, w - size));
        this.buttonY = Mathf.clamp(this.buttonY, 0, Math.max(0, h - size));
        table.setPosition(this.buttonX, this.buttonY);
        table.pack();

        // HUD group = visible in-game; also add to scene so it exists after load
        if (Vars.ui && Vars.ui.hudGroup) {
            Vars.ui.hudGroup.addChild(table);
        } else {
            Core.scene.add(table);
        }

        this.table = table;
        this.button = button;

        // Keep on screen if resolution / orientation changes
        Events.run(Trigger.update, () => {
            if (!MainMenu.table || MainMenu.isDragging) return;
            const tw = Core.graphics.getWidth();
            const th = Core.graphics.getHeight();
            const nx = Mathf.clamp(MainMenu.buttonX, 0, Math.max(0, tw - size));
            const ny = Mathf.clamp(MainMenu.buttonY, 0, Math.max(0, th - size));
            if (nx !== MainMenu.buttonX || ny !== MainMenu.buttonY) {
                MainMenu.buttonX = nx;
                MainMenu.buttonY = ny;
                MainMenu.table.setPosition(nx, ny);
            }
        });
    },

    createMainDialog() {
        this.dialog = new BaseDialog(I18n.get("menu.title", "Hackdustry Menu"));
        this.dialog.setFillParent(true);

        const cont = this.dialog.cont;

        // Search
        cont.table(search => {
            search.image(Icon.zoom).size(32).padRight(8);
            const field = search.field(this.searchQuery, text => {
                this.searchQuery = text;
                this.refreshContent();
            }).growX().get();
            field.setMessageText(I18n.get("search", "Search..."));
        }).growX().pad(8).row();

        // Tabs — use icons that exist on all Mindustry builds
        cont.table(tabs => {
            this.createTab(tabs, "resources", Icon.box);
            this.createTab(tabs, "acceleration", Icon.up);
            this.createTab(tabs, "units", Icon.units);
            this.createTab(tabs, "building", Icon.settings);
            this.createTab(tabs, "research", Icon.tree);
            this.createTab(tabs, "teleport", Icon.right);
            this.createTab(tabs, "vision", Icon.zoom);
            this.createTab(tabs, "player", Icon.players);
            this.createTab(tabs, "world", Icon.map);
            this.createTab(tabs, "favorites", Icon.star);
        }).growX().height(56).padBottom(6).row();

        const pane = new ScrollPane(new Table());
        pane.setScrollingDisabled(false, false);
        cont.add(pane).grow().pad(4).row();
        this.contentPane = pane;

        this.dialog.buttons.button("@close", Icon.cancel, () => {
            this.dialog.hide();
        }).size(180, 50);

        this.refreshContent();
    },

    createTab(table, name, icon) {
        table.button(icon, Styles.clearTogglei, 40, () => {
            this.currentTab = name;
            this.refreshContent();
        }).checked(b => this.currentTab === name)
          .tooltip(I18n.get("tab." + name, name));
    },

    refreshContent() {
        const content = new Table();
        content.defaults().pad(4);

        switch (this.currentTab) {
            case "resources": this.buildResourcesTab(content); break;
            case "acceleration": this.stub(content, "Acceleration"); break;
            case "units": this.stub(content, "Units"); break;
            case "building": this.stub(content, "Building"); break;
            case "research": this.stub(content, "Research"); break;
            case "teleport": this.stub(content, "Teleport"); break;
            case "vision": this.stub(content, "Vision"); break;
            case "player": this.stub(content, "Player"); break;
            case "world": this.stub(content, "World"); break;
            case "favorites": this.buildFavoritesTab(content); break;
        }

        this.contentPane.setWidget(content);
    },

    stub(content, title) {
        content.add("[accent]" + title).row();
        content.add("Coming soon...").padTop(16);
    },

    buildResourcesTab(content) {
        content.add(I18n.get("tab.resources", "Resources")).color(Pal.accent).row();

        content.table(t => {
            t.add(I18n.get("item-name", "Item:")).padRight(6);
            const itemField = t.field("", text => {}).width(140).get();
            itemField.setMessageText("copper");

            t.add(I18n.get("amount", "Amount:")).padLeft(8).padRight(6);
            const amountField = t.field("1000", text => {}).width(100).get();

            t.button(I18n.get("add", "Add"), Icon.add, () => {
                const itemName = itemField.getText();
                const amount = parseInt(amountField.getText()) || 1000;
                ResourcesModule.addItem(itemName, amount);
            }).height(44).padLeft(6);
        }).growX().padBottom(8).row();

        content.button(I18n.get("fill-core", "Fill Core (1M each)"), Icon.upload, () => {
            ResourcesModule.fillCore();
        }).growX().height(50).padBottom(4).row();

        content.button(I18n.get("add-all-10k", "Add All Items (10k)"), Icon.add, () => {
            ResourcesModule.addAllItems(10000);
        }).growX().height(50).padBottom(4).row();

        content.button(I18n.get("clear-items", "Clear All Items"), Icon.trash, () => {
            ResourcesModule.clearItems();
        }).growX().height(50).row();
    },

    buildFavoritesTab(content) {
        content.add("[accent]" + I18n.get("tab.favorites", "Favorites")).row();
        if (!this.favorites || this.favorites.length === 0) {
            content.add("No favorites yet").padTop(16);
        }
    },

    showMenu() {
        if (!this.dialog) return;
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

this.global.MainMenu = MainMenu;

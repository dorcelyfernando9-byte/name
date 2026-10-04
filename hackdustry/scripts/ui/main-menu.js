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

    // Toggle states for buttons that persist
    _states: {
        instantBuild: false,
        unitSpeed: false,
        invincible: false,
        infiniteRange: false,
        freeBuilding: false,
        fogDisabled: false,
        showEnemies: false,
        godMode: false,
        infiniteAmmo: false,
        flightMode: false,
        noClip: false,
        wavesDisabled: false
    },

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

    // ─── Floating "H" Button ─────────────────────────────────────────────────

    createFloatingButton() {
        const size = this.btnSize;
        const table = new Table();
        table.touchable = Touchable.enabled;

        const button = table.button("[#00ff00]H", Styles.defaultt, () => {
            // handled in touchUp
        }).size(size, size).get();

        button.setColor(Color.valueOf("00ff00aa"));

        button.addListener(extend(InputListener, {
            touchDown(event, x, y, pointer, btn) {
                MainMenu.isDragging = false;
                MainMenu.dragOffsetX = x;
                MainMenu.dragOffsetY = y;
                table.toFront();
                return true;
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
                    MainMenu.showMenu();
                }
            }
        }));

        const w = Core.graphics.getWidth();
        const h = Core.graphics.getHeight();
        this.buttonX = Mathf.clamp(this.buttonX, 0, Math.max(0, w - size));
        this.buttonY = Mathf.clamp(this.buttonY, 0, Math.max(0, h - size));
        table.setPosition(this.buttonX, this.buttonY);
        table.pack();

        if (Vars.ui && Vars.ui.hudGroup) {
            Vars.ui.hudGroup.addChild(table);
        } else {
            Core.scene.add(table);
        }

        this.table = table;
        this.button = button;

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

    // ─── Main Dialog ─────────────────────────────────────────────────────────

    createMainDialog() {
        this.dialog = new BaseDialog(I18n.get("menu.title", "Hackdustry Menu"));
        this.dialog.setFillParent(true);

        const cont = this.dialog.cont;

        // Search bar
        cont.table(search => {
            search.image(Icon.zoom).size(32).padRight(8);
            const field = search.field(this.searchQuery, text => {
                this.searchQuery = text;
                this.refreshContent();
            }).growX().get();
            field.setMessageText(I18n.get("search", "Search..."));
        }).growX().pad(8).row();

        // Tab bar — resources, acceleration, units, building, research,
        //           teleport, vision, player, world, music, favorites
        cont.table(tabs => {
            this.createTab(tabs, "resources",    Icon.box);
            this.createTab(tabs, "acceleration", Icon.up);
            this.createTab(tabs, "units",        Icon.units);
            this.createTab(tabs, "building",     Icon.settings);
            this.createTab(tabs, "research",     Icon.tree);
            this.createTab(tabs, "teleport",     Icon.right);
            this.createTab(tabs, "vision",       Icon.zoom);
            this.createTab(tabs, "player",       Icon.players);
            this.createTab(tabs, "world",        Icon.map);
            this.createTab(tabs, "music",        Icon.music);
            this.createTab(tabs, "favorites",    Icon.star);
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

        const q = this.searchQuery.toLowerCase().trim();

        switch (this.currentTab) {
            case "resources":    this.buildResourcesTab(content, q);    break;
            case "acceleration": this.buildAccelerationTab(content, q); break;
            case "units":        this.buildUnitsTab(content, q);        break;
            case "building":     this.buildBuildingTab(content, q);     break;
            case "research":     this.buildResearchTab(content, q);     break;
            case "teleport":     this.buildTeleportTab(content, q);     break;
            case "vision":       this.buildVisionTab(content, q);       break;
            case "player":       this.buildPlayerTab(content, q);       break;
            case "world":        this.buildWorldTab(content, q);        break;
            case "music":        this.buildMusicTab(content, q);        break;
            case "favorites":    this.buildFavoritesTab(content, q);    break;
        }

        this.contentPane.setWidget(content);
    },

    // ─── Helpers ─────────────────────────────────────────────────────────────

    // A simple action button that optionally matches a search query.
    // Returns true if it was added (so callers can count visible items).
    _btn(content, label, icon, action, searchQuery) {
        if (searchQuery && !label.toLowerCase().includes(searchQuery)) return false;
        content.button(label, icon, action).growX().height(50).padBottom(4).row();
        return true;
    },

    // A toggle button that keeps a visual state (on/off).
    _toggle(content, keyOn, keyOff, icon, stateKey, action, searchQuery) {
        const isOn = this._states[stateKey];
        const label = I18n.get(isOn ? keyOn : keyOff, isOn ? keyOn : keyOff);
        if (searchQuery && !label.toLowerCase().includes(searchQuery)) return false;
        content.button(label, icon, () => {
            this._states[stateKey] = !this._states[stateKey];
            action(this._states[stateKey]);
            this.refreshContent();
        }).growX().height(50).padBottom(4)
          .color(isOn ? Color.valueOf("00ff00aa") : Color.white)
          .row();
        return true;
    },

    // Section header
    _header(content, key, defaultText) {
        content.add("[accent]" + I18n.get(key, defaultText)).padTop(8).padBottom(2).row();
    },

    // ─── Resources Tab ───────────────────────────────────────────────────────

    buildResourcesTab(content, q) {
        this._header(content, "tab.resources", "Resources");

        // Item + amount fields
        if (!q || "add item".includes(q)) {
            content.table(t => {
                t.add(I18n.get("item-name", "Item:")).padRight(6);
                const itemField = t.field("", text => {}).width(130).get();
                itemField.setMessageText("copper");

                t.add(I18n.get("amount", "Amount:")).padLeft(8).padRight(6);
                const amountField = t.field("1000", text => {}).width(90).get();

                t.button(I18n.get("add", "Add"), Icon.add, () => {
                    const itemName = itemField.getText().trim();
                    const amount   = parseInt(amountField.getText()) || 1000;
                    ResourcesModule.addItem(itemName, amount);
                }).height(44).padLeft(6);
            }).growX().padBottom(8).row();
        }

        this._btn(content, I18n.get("fill-core",    "Fill Core (1M each)"),   Icon.upload, () => ResourcesModule.fillCore(),         q);
        this._btn(content, I18n.get("add-all-10k",  "Add All Items (10k)"),   Icon.add,    () => ResourcesModule.addAllItems(10000), q);
        this._btn(content, I18n.get("clear-items",  "Clear All Items"),        Icon.trash,  () => ResourcesModule.clearItems(),        q);
    },

    // ─── Acceleration Tab ────────────────────────────────────────────────────

    buildAccelerationTab(content, q) {
        this._header(content, "tab.acceleration", "Acceleration");

        // Speed slider row
        if (!q || "speed".includes(q)) {
            content.table(t => {
                t.add(I18n.get("game-speed", "Speed:")).padRight(8);
                const speeds = [0.5, 1.0, 2.0, 3.0, 5.0, 10.0];
                speeds.forEach(s => {
                    t.button(s + "x", () => {
                        AccelerationModule.setGameSpeed(s);
                    }).size(54, 40).padRight(4);
                });
            }).growX().padBottom(8).row();

            this._btn(content, I18n.get("speed-reset", "Reset Speed (1x)"), Icon.refresh, () => {
                AccelerationModule.resetSpeed();
            }, q);
        }

        this._toggle(content,
            "instant-build-off", "instant-build-on",
            Icon.hammer,
            "instantBuild",
            (on) => AccelerationModule.enableInstantBuild(on),
            q
        );

        this._toggle(content,
            "unit-speed-off", "unit-speed-on",
            Icon.up,
            "unitSpeed",
            (on) => AccelerationModule.boostUnitSpeed(on),
            q
        );
    },

    // ─── Units Tab ───────────────────────────────────────────────────────────

    buildUnitsTab(content, q) {
        this._header(content, "tab.units", "Units");

        // Spawn unit by name
        if (!q || "spawn unit".includes(q)) {
            content.table(t => {
                t.add(I18n.get("unit-name", "Unit:")).padRight(6);
                const unitField = t.field("", text => {}).width(140).get();
                unitField.setMessageText("mono");

                t.add(I18n.get("amount", "Amount:")).padLeft(8).padRight(6);
                const amtField = t.field("1", text => {}).width(70).get();

                t.button(I18n.get("spawn", "Spawn"), Icon.add, () => {
                    const unitName = unitField.getText().trim();
                    const amount   = parseInt(amtField.getText()) || 1;
                    UnitsModule.spawnUnit(unitName, amount);
                }).height(44).padLeft(6);
            }).growX().padBottom(8).row();
        }

        this._btn(content, I18n.get("spawn-all-units", "Spawn All Units"),    Icon.units,  () => UnitsModule.spawnAllUnits(), q);
        this._btn(content, I18n.get("kill-enemies",    "Kill All Enemies"),   Icon.cancel, () => UnitsModule.killEnemies(),   q);
        this._btn(content, I18n.get("heal-allies",     "Heal All Allies"),    Icon.add,    () => UnitsModule.healAllies(),    q);

        this._toggle(content,
            "invincible-off", "invincible-on",
            Icon.defense,
            "invincible",
            (on) => UnitsModule.makeInvincible(on),
            q
        );
    },

    // ─── Building Tab ────────────────────────────────────────────────────────

    buildBuildingTab(content, q) {
        this._header(content, "tab.building", "Building");

        this._btn(content, I18n.get("built-all-btn",       "Instant Build All"),        Icon.hammer,  () => BuildingModule.instantBuildAll(),         q);
        this._btn(content, I18n.get("destroy-enemies-btn", "Destroy Enemy Buildings"),  Icon.cancel,  () => BuildingModule.destroyEnemyBuildings(),    q);
        this._btn(content, I18n.get("heal-buildings-btn",  "Heal All Buildings"),       Icon.add,     () => BuildingModule.healAllBuildings(),         q);

        this._toggle(content,
            "infinite-range-off", "infinite-range-on",
            Icon.resize,
            "infiniteRange",
            (on) => BuildingModule.infiniteRange(on),
            q
        );

        this._toggle(content,
            "free-build-off", "free-build-on",
            Icon.box,
            "freeBuilding",
            (on) => BuildingModule.freeBuilding(on),
            q
        );
    },

    // ─── Research Tab ────────────────────────────────────────────────────────

    buildResearchTab(content, q) {
        this._header(content, "tab.research", "Research");

        this._btn(content, I18n.get("unlock-all-btn",  "Unlock All Technologies"), Icon.tree,    () => ResearchModule.unlockAll(), q);
        this._btn(content, I18n.get("reset-all-btn",   "Reset Research Tree"),      Icon.trash,   () => {
            Vars.ui.showConfirm("@hackdustry.confirm-reset", () => ResearchModule.resetAll());
        }, q);

        // Unlock specific item
        if (!q || "unlock specific".includes(q)) {
            content.table(t => {
                t.add(I18n.get("unlock-name", "Name:")).padRight(6);
                const nameField = t.field("", text => {}).width(180).get();
                nameField.setMessageText("router");
                t.button(I18n.get("unlock-btn", "Unlock"), Icon.tree, () => {
                    ResearchModule.unlock(nameField.getText().trim());
                }).height(44).padLeft(6);
            }).growX().padBottom(8).row();
        }
    },

    // ─── Teleport Tab ────────────────────────────────────────────────────────

    buildTeleportTab(content, q) {
        this._header(content, "tab.teleport", "Teleport");

        this._btn(content, I18n.get("tp-core",       "Teleport to Core"),       Icon.home,  () => TeleportModule.teleportToCore(),      q);
        this._btn(content, I18n.get("tp-enemy-core", "Teleport to Enemy Core"), Icon.right, () => TeleportModule.teleportToEnemyCore(), q);

        // Teleport to coordinates
        if (!q || "teleport coordinates".includes(q)) {
            content.table(t => {
                t.add("X:").padRight(4);
                const xField = t.field("0", text => {}).width(80).get();
                t.add("Y:").padLeft(8).padRight(4);
                const yField = t.field("0", text => {}).width(80).get();
                t.button(I18n.get("tp-go", "Go"), Icon.right, () => {
                    const x = parseFloat(xField.getText()) || 0;
                    const y = parseFloat(yField.getText()) || 0;
                    TeleportModule.teleportTo(x * 8, y * 8); // tiles → world units
                }).height(44).padLeft(6);
            }).growX().padBottom(8).row();
        }

        // Save current position
        if (!q || "save position".includes(q)) {
            content.table(t => {
                t.add(I18n.get("save-pos-label", "Save as:")).padRight(6);
                const nameField = t.field("", text => {}).width(150).get();
                nameField.setMessageText("home");
                t.button(I18n.get("save-pos", "Save"), Icon.save, () => {
                    const name = nameField.getText().trim() || "pos" + Date.now();
                    TeleportModule.savePosition(name);
                    this.refreshContent();
                }).height(44).padLeft(6);
            }).growX().padBottom(8).row();
        }

        // Saved positions list
        const saved = TeleportModule.savedPositions;
        if (saved && saved.length > 0) {
            this._header(content, "saved-positions", "Saved Positions");
            saved.forEach(pos => {
                if (q && !pos.name.toLowerCase().includes(q)) return;
                content.table(row => {
                    row.button(pos.name, Icon.right, () => {
                        TeleportModule.loadPosition(pos.name);
                    }).growX().height(44);
                    row.button("", Icon.trash, () => {
                        TeleportModule.deletePosition(pos.name);
                        this.refreshContent();
                    }).size(44).padLeft(4);
                }).growX().padBottom(4).row();
            });
        }
    },

    // ─── Vision Tab ──────────────────────────────────────────────────────────

    buildVisionTab(content, q) {
        this._header(content, "tab.vision", "Vision");

        this._toggle(content,
            "fog-enabled", "fog-disabled",
            Icon.zoom,
            "fogDisabled",
            (on) => VisionModule.revealMap(on),
            q
        );

        this._toggle(content,
            "enemy-hidden", "enemy-visible",
            Icon.units,
            "showEnemies",
            (on) => VisionModule.showEnemyUnits(on),
            q
        );

        this._btn(content, I18n.get("reveal-tech", "Reveal Tech Tree"), Icon.tree, () => {
            VisionModule.revealTechTree();
        }, q);
    },

    // ─── Player Tab ──────────────────────────────────────────────────────────

    buildPlayerTab(content, q) {
        this._header(content, "tab.player", "Player");

        this._toggle(content,
            "god-mode-off", "god-mode-on",
            Icon.defense,
            "godMode",
            (on) => PlayerModule.godMode(on),
            q
        );

        this._toggle(content,
            "infinite-ammo-off", "infinite-ammo-on",
            Icon.box,
            "infiniteAmmo",
            (on) => PlayerModule.infiniteAmmo(on),
            q
        );

        this._toggle(content,
            "flight-off", "flight-on",
            Icon.up,
            "flightMode",
            (on) => PlayerModule.flightMode(on),
            q
        );

        this._toggle(content,
            "noclip-off", "noclip-on",
            Icon.resize,
            "noClip",
            (on) => PlayerModule.noClip(on),
            q
        );

        this._btn(content, I18n.get("healed", "Heal Player"),  Icon.add,    () => PlayerModule.heal(),    q);
        this._btn(content, I18n.get("dead",   "Kill Yourself"), Icon.cancel, () => PlayerModule.suicide(), q);

        // Team selector
        if (!q || "team".includes(q)) {
            this._header(content, "change-team", "Change Team");
            content.table(t => {
                // Teams 0–5 are typically used in Mindustry
                const teamNames = ["Derelict", "Sharded", "Crux", "Malis", "Green", "Blue"];
                teamNames.forEach((name, i) => {
                    t.button(name, () => PlayerModule.changeTeam(i)).size(90, 40).padRight(4);
                    if ((i + 1) % 3 === 0) t.row();
                });
            }).growX().padBottom(8).row();
        }
    },

    // ─── World Tab ───────────────────────────────────────────────────────────

    buildWorldTab(content, q) {
        this._header(content, "tab.world", "World");

        this._btn(content, I18n.get("instant-win",    "Instant Victory"),         Icon.up,      () => WorldModule.instantWin(),    q);
        this._btn(content, I18n.get("next-wave",      "Next Wave"),                Icon.right,   () => WorldModule.nextWave(),      q);
        this._btn(content, I18n.get("waves-cleared",  "Clear All Waves (reset)"), Icon.trash,   () => WorldModule.clearWaves(),    q);
        this._btn(content, I18n.get("fire-removed",   "Remove All Fire"),          Icon.cancel,  () => WorldModule.removeFire(),    q);
        this._btn(content, I18n.get("puddles-removed","Remove All Puddles"),       Icon.cancel,  () => WorldModule.removePuddles(), q);

        this._toggle(content,
            "waves-enabled", "waves-disabled",
            Icon.map,
            "wavesDisabled",
            (on) => WorldModule.disableWaves(on),
            q
        );
    },

    // ─── Music Tab ───────────────────────────────────────────────────────────

    buildMusicTab(content, q) {
        this._header(content, "tab.music", "Music");

        // Now-playing info
        if (!q) {
            const np = MusicPlayerModule.currentTrack;
            const playing = MusicPlayerModule.isPlaying;
            content.add(
                np
                    ? "[accent]♪ " + np.name + (playing ? "" : " [paused]")
                    : "[gray]No track selected"
            ).padBottom(6).row();
        }

        // Controls row
        if (!q || "music controls".includes(q)) {
            content.table(ctrl => {
                ctrl.button("", Icon.left, () => {
                    MusicPlayerModule.previous();
                    this.refreshContent();
                }).size(52).padRight(4);

                ctrl.button("", MusicPlayerModule.isPlaying ? Icon.pause : Icon.play, () => {
                    MusicPlayerModule.togglePause();
                    this.refreshContent();
                }).size(52).padRight(4);

                ctrl.button("", Icon.right, () => {
                    MusicPlayerModule.next();
                    this.refreshContent();
                }).size(52).padRight(4);

                ctrl.button("", Icon.refresh, () => {
                    MusicPlayerModule.shuffle();
                    this.refreshContent();
                }).size(52).padRight(4);

                ctrl.button("", Icon.cancel, () => {
                    MusicPlayerModule.stop();
                    this.refreshContent();
                }).size(52);
            }).padBottom(8).row();
        }

        // Volume slider
        if (!q || "volume".includes(q)) {
            content.table(t => {
                t.add(I18n.get("volume", "Volume:")).padRight(8);
                const slider = t.slider(0, 1, 0.05, MusicPlayerModule.volume, val => {
                    MusicPlayerModule.setVolume(val);
                }).growX().get();
            }).growX().padBottom(8).row();
        }

        // Rescan + folder info
        this._btn(content, I18n.get("rescan", "Rescan Music Folder"), Icon.refresh, () => {
            MusicPlayerModule.scanMusicFolder();
            Vars.ui.showInfoFade(
                I18n.format("rescanned", MusicPlayerModule.musicList.length)
            );
            this.refreshContent();
        }, q);

        this._btn(content, I18n.get("music-folder", "Show Music Folder"), Icon.file, () => {
            MusicPlayerModule.showMusicFolderInfo();
        }, q);

        // Track list
        if (!q || "tracks".includes(q) || MusicPlayerModule.musicList.some(t => t.name.toLowerCase().includes(q))) {
            const tracks = MusicPlayerModule.musicList;
            if (tracks.length === 0) {
                content.add("[gray]" + I18n.get("music-folder-info", "No tracks found. Add .ogg/.mp3 files to the music folder.")).padTop(8).row();
            } else {
                this._header(content, "found-tracks", "Tracks (" + tracks.length + ")");
                tracks.forEach(track => {
                    if (q && !track.name.toLowerCase().includes(q)) return;
                    const isCurrent = MusicPlayerModule.currentTrack === track;
                    content.button(
                        (isCurrent ? "[accent]♪ " : "") + track.name,
                        Icon.music,
                        () => {
                            MusicPlayerModule.play(track.name);
                            this.refreshContent();
                        }
                    ).growX().height(44).padBottom(4)
                     .color(isCurrent ? Color.valueOf("00ff00aa") : Color.white)
                     .row();
                });
            }
        }
    },

    // ─── Favorites Tab ───────────────────────────────────────────────────────

    buildFavoritesTab(content, q) {
        this._header(content, "tab.favorites", "Favorites");

        // The favorites system stores {label, tab, action} objects.
        // For a mod context we store action keys and replay them.
        const favoriteActions = [
            { key: "fill-core",       label: I18n.get("fill-core",    "Fill Core"),          icon: Icon.upload,  action: () => ResourcesModule.fillCore()            },
            { key: "unlock-all",      label: I18n.get("unlock-all-btn","Unlock All Tech"),    icon: Icon.tree,    action: () => ResearchModule.unlockAll()             },
            { key: "kill-enemies",    label: I18n.get("kill-enemies", "Kill All Enemies"),   icon: Icon.cancel,  action: () => UnitsModule.killEnemies()              },
            { key: "instant-win",     label: I18n.get("instant-win",  "Instant Victory"),    icon: Icon.up,      action: () => WorldModule.instantWin()               },
            { key: "heal-player",     label: I18n.get("healed",       "Heal Player"),         icon: Icon.add,     action: () => PlayerModule.heal()                    },
            { key: "heal-buildings",  label: I18n.get("heal-buildings-btn","Heal Buildings"), icon: Icon.add,     action: () => BuildingModule.healAllBuildings()      },
            { key: "tp-core",         label: I18n.get("tp-core",      "Teleport to Core"),   icon: Icon.home,    action: () => TeleportModule.teleportToCore()        },
            { key: "next-wave",       label: I18n.get("next-wave",    "Next Wave"),           icon: Icon.right,   action: () => WorldModule.nextWave()                 },
            { key: "fog-off",         label: I18n.get("fog-disabled", "Disable Fog"),        icon: Icon.zoom,    action: () => VisionModule.revealMap(true)           },
            { key: "add-all-items",   label: I18n.get("add-all-10k",  "Add All Items (10k)"),icon: Icon.add,     action: () => ResourcesModule.addAllItems(10000)     },
            { key: "spawn-all",       label: I18n.get("spawn-all-units","Spawn All Units"),  icon: Icon.units,   action: () => UnitsModule.spawnAllUnits()             },
            { key: "remove-fire",     label: I18n.get("fire-removed", "Remove Fire"),        icon: Icon.cancel,  action: () => WorldModule.removeFire()               },
        ];

        if (favoriteActions.length === 0) {
            content.add("[gray]No favorites").padTop(16).row();
            return;
        }

        favoriteActions.forEach(fav => {
            if (q && !fav.label.toLowerCase().includes(q)) return;
            this._btn(content, fav.label, fav.icon, fav.action, null /* already filtered */);
        });
    },

    // ─── Persistence ─────────────────────────────────────────────────────────

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

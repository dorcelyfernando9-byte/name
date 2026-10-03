// Command Block - Execute JavaScript commands

const commandBlock = extend(MessageBlock, "command", {});

commandBlock.buildType = () => extend(Building, {
    updateTile() {
        this.health = Number.MAX_VALUE;
    },
    
    buildConfiguration(table) {
        table.button(new TextureRegionDrawable(Icon.terminal.getRegion()), Styles.defaulti, 40, run(() => {
            const dialog = new BaseDialog(I18n.get("command-block", "Command Block"));
            dialog.setFillParent(true);
            
            const textArea = new TextArea("");
            textArea.setMessageText(I18n.get("enter-js", "Enter JavaScript code..."));
            
            dialog.cont.add(I18n.get("js-console", "JavaScript Console")).color(Color.accent).row();
            dialog.cont.add(textArea).width(600).height(300).pad(10).row();
            dialog.cont.add("[gray]" + I18n.get("js-warning", "Execute code carefully!")).row();
            
            dialog.buttons.button("@hackdustry.execute", Icon.play, run(() => {
                const code = textArea.getText();
                if (code && code.length > 0) {
                    try {
                        if (Vars.net.client()) {
                            print("[Hackdustry] Online mode - sending command");
                            Call.sendChatMessage("/js " + code);
                        } else {
                            print("[Hackdustry] Executing: " + code);
                            Vars.mods.getScripts().runConsole(code);
                        }
                        Vars.ui.showInfoFade("@hackdustry.executed");
                    } catch (e) {
                        Vars.ui.showInfoFade("[red]Error: " + e);
                        print("[Hackdustry] Error: " + e);
                    }
                }
            })).width(250).height(60);
            
            dialog.buttons.button("@close", Icon.cancel, run(() => {
                dialog.hide();
            })).width(250).height(60);
            
            dialog.show();
        })).size(50);
    }
});

commandBlock.update = true;
commandBlock.configurable = true;
commandBlock.health = 999999999;

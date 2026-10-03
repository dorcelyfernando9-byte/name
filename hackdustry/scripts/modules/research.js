// Research Module - Unlock technology tree

const Research = {
    // Unlock all research
    unlockAll() {
        let count = 0;
        
        Vars.content.blocks().each(block => {
            if (block.techNode && !block.techNode.finished()) {
                block.techNode.finish();
                count++;
            }
        });
        
        Vars.content.units().each(unit => {
            if (unit.techNode && !unit.techNode.finished()) {
                unit.techNode.finish();
                count++;
            }
        });
        
        Vars.ui.showInfoFade(I18n.format("unlocked-all", count));
        return true;
    },
    
    // Unlock specific block/unit
    unlock(name) {
        const block = Vars.content.block(name);
        if (block && block.techNode) {
            block.techNode.finish();
            Vars.ui.showInfoFade(I18n.format("unlocked", block.localizedName));
            return true;
        }
        
        const unit = Vars.content.unit(name);
        if (unit && unit.techNode) {
            unit.techNode.finish();
            Vars.ui.showInfoFade(I18n.format("unlocked", unit.localizedName));
            return true;
        }
        
        Vars.ui.showInfoFade(I18n.format("not-found", name));
        return false;
    },
    
    // Reset all research
    resetAll() {
        let count = 0;
        
        Vars.content.blocks().each(block => {
            if (block.techNode && block.techNode.finished()) {
                block.techNode.reset();
                count++;
            }
        });
        
        Vars.content.units().each(unit => {
            if (unit.techNode && unit.techNode.finished()) {
                unit.techNode.reset();
                count++;
            }
        });
        
        Vars.ui.showInfoFade(I18n.format("reset-all", count));
        return true;
    }
};

this.global.ResearchModule = Research;

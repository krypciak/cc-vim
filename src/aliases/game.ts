import { VimLogic, AliasArguemntEntry } from '../logic.js'

declare const vim: VimLogic
declare const chrome: { runtime: { reload: () => void } }

function nukeInteractable() {
    ig.interact.entries.forEach((e) => ig.interact.removeEntry(e))
}

function gotoTitle() {
    sc.model.enterReset()
    sc.model.enterRunning()
    ig.game.reset()
    sc.model.enterTitle()
}

export function addGame() {
    vim.addAlias('cc-vim', 'reload', 'Reload the game without closing the window', 'global', () => { window.location.reload() })
    vim.addAlias('cc-vim', 'reloadnl', 'Reload the game without memory leaks (closes the window)', 'global', () => { chrome ? chrome.runtime.reload() : window.location.reload() })
    
    
    vim.addAlias('cc-vim', 'load-preset', 'Load save preset', 'global', (presetId: string) => {
        const id = parseInt(presetId.trim())
        gotoTitle()
        nukeInteractable()
        sc.savePreset.load(id)
    }, [{
            type: 'number', description: 'Preset to load', possibleArguments(): AliasArguemntEntry[] {
                const arr: AliasArguemntEntry[] = []

                for (const i of Object.keys(sc.savePreset.slots)) {
                    const slot: sc.SavePresetData = sc.savePreset.slots[parseInt(i)]
                    const value = i.toString()
                    const keys = [ value, slot.title.value, slot.sub.value, slot.path ]
                    arr.push({ value, keys, display: keys})
                }
                return arr
            },
    }])

    vim.addAlias('cc-vim', 'title-screen', 'Go to title screen', 'global', () => { gotoTitle() })
}

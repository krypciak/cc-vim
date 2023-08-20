import { VimLogic } from './logic.js'
declare const vim: VimLogic
declare const chrome: { runtime: { reload: () => void } }

function nukeInteractable() {
    ig.interact.entries.forEach((e) => ig.interact.removeEntry(e))
}

export function addBaseAliases() {
    vim.addAlias('cc-vim', 'reload', 'Reload the game without closing the window', 'global', () => { window.location.reload() })
    vim.addAlias('cc-vim', 'reloadnl', 'Reload the game without memory leaks (closes the window)', 'global', () => { chrome ? chrome.runtime.reload() : window.location.reload() })
    
    vim.addAlias('cc-vim', 'ppos', 'Prints player position', 'ingame', () => { console.log(ig.game.playerEntity ? ig.copy(ig.game.playerEntity.coll.pos) : null) })
    vim.addAlias('cc-vim', 'player', 'Prints player entity', 'ingame', () => { console.log(ig.copy(ig.game.playerEntity)) })
    
    vim.addAlias('cc-vim', 'load-preset', 'Load save preset', 'global', (presetId: string) => {
        const id = parseInt(presetId.trim())
        nukeInteractable()
        // @ts-expect-error sc.savePreset missing from typedefs
        sc.savePreset.load(id)
    })
}

import { VimLogic, AliasArguemntEntry } from './logic.js'

declare const vim: VimLogic
declare const chrome: { runtime: { reload: () => void } }

function nukeInteractable() {
    ig.interact.entries.forEach((e) => ig.interact.removeEntry(e))
}

export function addBaseAliases() {
    vim.addAlias('cc-vim', 'reload', 'Reload the game without closing the window', 'global', () => { window.location.reload() })
    vim.addAlias('cc-vim', 'reloadnl', 'Reload the game without memory leaks (closes the window)', 'global', () => { chrome ? chrome.runtime.reload() : window.location.reload() })
    
    vim.addAlias('cc-vim', 'player', 'Prints player entity', 'ingame', () => { console.log(ig.copy(ig.game.playerEntity)) })
    vim.addAlias('cc-vim', 'player-pos', 'Prints player position', 'ingame', () => { console.log(ig.copy(ig.game.playerEntity.coll.pos)) })

    vim.addAlias('cc-vim', 'player-move', 'Move player', 'ingame', (x?: string, y?: string, z?: string) => {
        const pos: Vec3 = ig.game.playerEntity.coll.pos
        ig.game.playerEntity.setPos(pos.x + parseInt(x ?? '0'), pos.y + parseInt(y ?? '0'), pos.z + parseInt(z ?? '0'))
    }, [
            { type: 'number', description: 'x to add' },
            { type: 'number', description: 'y to add' },
            { type: 'number', description: 'z to add' },
    ])
    
    vim.addAlias('cc-vim', 'load-preset', 'Load save preset', 'global', (presetId: string) => {
        const id = parseInt(presetId.trim())
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

    vim.addAlias('cc-vim', 'change-character', 'Change the playable character', 'ingame', (name: string) => {
        sc.model.player.setConfig(sc.party.models[name].config)
    }, [ { type: 'string', description: 'Character name', possibleArguments(): AliasArguemntEntry[] {
        const arr: AliasArguemntEntry[] = []
        for (const char of Object.keys(sc.party.models)) {
            const other: string[] = []
            switch (char) {
                case 'Glasses': other.push('Ctron'); other.push('Tonny'); break
            }
            const keys = [ char, ...other ]
            arr.push({ value: char, keys, display: keys })
        }

        return arr
    },
    }])
}

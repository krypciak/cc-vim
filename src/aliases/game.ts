import type { AliasArguemntEntry } from '../logic.js'

declare const chrome: { runtime: { reload: () => void } }

declare global {
    namespace ig {
        interface Storage {
            saveGlobals(this: this): void
        }
    }
    namespace sc {
        interface OptionModel {
            set(this: this, option: string, value: any): void
        }
    }
}
function nukeInteractable() {
    ig.interact.entries.forEach(e => ig.interact.removeEntry(e))
}

function gotoTitle() {
    sc.model.enterReset()
    sc.model.enterRunning()
    ig.game.reset()
    sc.model.enterTitle()
}

function copyTextToClipboard(text: string) {
    const nwClipboard = window.nw?.Clipboard?.get()
    if (nwClipboard) {
        nwClipboard.set(text, 'text')
    } else {
        window.navigator?.clipboard?.writeText?.(text)
    }
}

export function addGameAliases() {
    vim.addAlias('cc-vim', 'reload', 'Reload the game without closing the window', 'global', () => {
        window.location.reload()
    })
    vim.addAlias('cc-vim', 'reloadnl', 'Reload the game without memory leaks (closes the window)', 'global', () => {
        chrome ? chrome.runtime.reload() : window.location.reload()
    })

    vim.addAlias('cc-vim', 'reload-level', 'Reload the map', 'ingame', async () => {
        const tppos = new ig.TeleportPosition()
        const { x, y } = ig.game.playerEntity.getCenter()
        const z = ig.game.playerEntity.coll.pos.z
        tppos.pos = Vec3.createC(x, y, z)
        tppos.baseZPos = z
        tppos.level = ig.game.playerEntity.coll.level as unknown as number
        tppos.face = Vec2.create(ig.game.playerEntity.face)
        ig.game.teleport(ig.game.mapName, tppos)
        ig.game.teleporting.timer = 0
    })

    vim.addAlias(
        'cc-vim',
        'load-preset',
        'Load save preset',
        'global',
        (presetId: string) => {
            const id = parseInt(presetId.trim())
            gotoTitle()
            nukeInteractable()
            sc.savePreset.load(id)
        },
        [
            {
                type: 'number',
                description: 'Preset to load',
                possibleArguments(): AliasArguemntEntry[] {
                    const arr: AliasArguemntEntry[] = []

                    for (const i of Object.keys(sc.savePreset.slots)) {
                        const slot: sc.SavePresetData = sc.savePreset.slots[parseInt(i)]
                        const value = i.toString()
                        const keys = [value, slot.title.value, slot.sub.value, slot.path]
                        arr.push({ value, keys, display: keys })
                    }
                    return arr
                },
            },
        ]
    )

    vim.addAlias('cc-vim', 'title-screen', 'Go to title screen', 'global', () => {
        gotoTitle()
    })

    vim.addAlias('cc-vim', 'reset-map-vars', 'Reset all map variables in the current map', 'ingame', () => {
        const path = ig.game.mapName.toCamel().toPath('', '')
        ig.vars.storage.map = ig.vars.storage.maps[path] = {}
    })

    vim.addAlias('cc-vim', 'copy-map-name', 'Copy map name (ig.game.mapName) to clipboard', 'ingame', () => {
        const mapName = ig.game.mapName
        copyTextToClipboard(mapName)
    })
}

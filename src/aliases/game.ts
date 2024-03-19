import { AliasArguemntEntry } from '../logic.js'

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

export function addGame() {
    vim.addAlias('cc-vim', 'reload', 'Reload the game without closing the window', 'global', () => {
        window.location.reload()
    })
    vim.addAlias('cc-vim', 'reloadnl', 'Reload the game without memory leaks (closes the window)', 'global', () => {
        chrome ? chrome.runtime.reload() : window.location.reload()
    })

    vim.addAlias('cc-vim', 'reload-level', 'Reload the map', 'ingame', async () => {
        const tppos = new ig.TeleportPosition()
        tppos.pos = Vec3.create(ig.game.playerEntity.coll.pos)
        tppos.baseZPos = tppos.pos.y
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

    vim.addAlias(
        'cc-vim',
        'option',
        'Set a global option setting',
        'global',
        (option: string, value: string) => {
            value = value.trim()
            let val: any
            if (value === 'true') {
                val = true
            } else if (value === 'false') {
                val = false
            } else if (!isNaN(parseInt(value))) {
                val = parseInt(value)
            } else {
                val = value
            }
            sc.options.set(option, val)
            ig.storage.saveGlobals()
        },
        [
            {
                type: 'string',
                description: 'value name',
                possibleArguments(): AliasArguemntEntry[] {
                    const arr: AliasArguemntEntry[] = Object.keys(sc.options.values)
                        .filter(str => {
                            const type = sc.OPTIONS_DEFINITION[str].type
                            return type !== 'INFO' && type !== 'CONTROLS'
                        })
                        .map(str => {
                            const entryTxt: undefined | { name: string; description: string } = ig.lang.labels.sc.gui.options[str]

                            const keys: string[] = [str]
                            if (entryTxt?.name) {
                                keys.push(entryTxt.name)
                            }
                            if (entryTxt?.description) {
                                keys.push(entryTxt.description)
                            }

                            return { value: str, keys, display: keys }
                        })
                    return arr
                },
            },
            {
                type: 'string',
                description: 'value',
                possibleArguments(): AliasArguemntEntry[] {
                    return [
                        { value: 'true', keys: ['true'], display: ['true'] },
                        { value: 'false', keys: ['false'], display: ['false'] },
                    ]
                    // const arr: AliasArguemntEntry[] = Object.keys(sc.options.values).filter(str => {
                    //     const type = sc.OPTIONS_DEFINITION[str].type
                    //     return type !== 'INFO' && type !== 'CONTROLS'
                    // }).map(str => {
                    //     const entryTxt: { name: string, description: string, group?: string[] } = ig.lang.labels.sc.gui.options[str]
                    //     const entry: sc.OptionDefinition = sc.OPTIONS_DEFINITION[str]

                    //     let types: [string, any][] = []
                    //     switch (entry.type) {
                    //         case 'LANGUAGE':
                    //         case 'BUTTON_GROUP': {
                    //             const vals = Object.values(entry.data)
                    //             for (let i = 0; i < entryTxt.group!.length; i++) {
                    //                 types.push([entryTxt.group![i], vals[i]])
                    //             }
                    //             break
                    //         }
                    //         case 'OBJECT_SLIDER': {
                    //             types = Object.entries(entry.data).map(e => [e[0], e[1]])
                    //             break
                    //         }
                    //         case 'ARRAY_SLIDER':
                    //             for (let i = entry.data[0]; i < entry.data[1]; i += 0.1) {
                    //                 types.push([i.toString(), i])
                    //             }
                    //             break
                    //         case 'CHECKBOX':
                    //             types = [['true', true], ['false', false]]
                    //             break
                    //     }
                    //     const keys: string[] = types.map(t => t[0])
                    //     return { value: keys[0], keys, display: keys }
                    // })
                    // return arr
                },
            },
        ]
    )

    vim.addAlias('cc-vim', 'reset-map-vars', 'Reset all map variables in the current map', 'ingame', () => {
        const path = ig.game.mapName.toCamel().toPath('', '')
        ig.vars.storage.map = ig.vars.storage.maps[path] = {}
    })
}

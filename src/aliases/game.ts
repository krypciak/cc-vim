import { getAllMapsRecursive, sortMapInfoList } from '../all-maps-list'
import type { AliasArguemntEntry } from '../logic'

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

function eventTeleport(map: string, marker: Nullable<string> = 'landmark') {
    const steps: ig.EventStepBase.Settings[] = [
        { type: 'TELEPORT', map: map, marker },
        // { time: 3, ignoreSlowDown: false, type: 'WAIT' },
    ]
    const event = new ig.Event({ steps })
    event.addHint('SKIN_ALLOWED')
    sc.map.teleportEvent = event

    sc.model.enterRunning()

    ig.game.setTeleportTime(0, 0)
    sc.Cutscene.startCutscene(event)
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
        const player = ig.game.playerEntity
        const { x, y } = player.getCenter()
        const z = player.coll.baseZPos
        tppos.pos = { x, y, z }
        tppos.baseZPos = z
        tppos.level = player.coll.level as unknown as number
        tppos.face = Vec2.create(player.face)
        ig.game.teleport(ig.game.mapName, tppos)
        ig.game.setTeleportTime(0, 0)
    })

    vim.addAlias(
        'cc-vim',
        'teleport',
        'Teleport to a map',
        'ingame',
        async (mapName: string, marker?: Nullable<string>) => {
            mapName = mapName.trim()
            if (!mapName) return
            eventTeleport(mapName, marker)
        },
        [
            {
                type: 'string',
                description: 'Map path',
                async possibleArguments() {
                    const arr: AliasArguemntEntry[] = []
                    const maps = await getAllMapsRecursive()
                    sortMapInfoList(maps)
                    for (const { name, source, sourceDetails } of maps) {
                        const keys = [name, source, sourceDetails ?? '']
                        arr.push({ value: name, keys, display: keys })
                    }
                    return arr
                },
            },
        ]
    )

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
        ig.game.varsChangedDeferred()
    })

    vim.addAlias('cc-vim', 'copy-map-name', 'Copy map name (ig.game.mapName) to clipboard', 'ingame', () => {
        const mapName = ig.game.mapName
        copyTextToClipboard(mapName)
    })
}

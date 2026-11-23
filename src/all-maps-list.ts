import { getFilesRecursive } from 'ccmodmanager/src/fs-util'
import type { Mod1 } from 'ccmodmanager/types/types'

interface MapInfo {
    name: string
    path: string
    source: 'base' | 'extension' | 'mod'
    sourceDetails?: string
}

let getAllMapsRecursivePromise: Promise<MapInfo[]> | undefined
export async function getAllMapsRecursive() {
    return (getAllMapsRecursivePromise ??= actuallyGetAllMapsRecursive())
}
async function actuallyGetAllMapsRecursive(): Promise<MapInfo[]> {
    const maps: MapInfo[] = []
    await Promise.all([baseMaps(maps), extensionMaps(maps), allModMaps(maps)])
    return maps
}

export function sortMapInfoList(maps: MapInfo[]) {
    const SOURCE_RANK: Record<MapInfo['source'], number> = {
        base: 0,
        extension: 1,
        mod: 2,
    }

    function cmpOptional(a?: string, b?: string): number {
        if (a === b) return 0
        if (a === undefined) return 1
        if (b === undefined) return -1
        return a.localeCompare(b)
    }

    maps.sort((a, b) => {
        const bySource = SOURCE_RANK[a.source] - SOURCE_RANK[b.source]
        if (bySource !== 0) return bySource

        const byDetails = cmpOptional(a.sourceDetails, b.sourceDetails)
        if (byDetails !== 0) return byDetails

        return a.name.localeCompare(b.name)
    })
}

function isMapFileAndStripSuffix(path: string) {
    if (path.endsWith('.patch.json')) return
    if (path.endsWith('.json.patch')) return
    if (!path.endsWith('.json')) return
    return path.slice(0, -5)
}

async function baseMaps(dest: MapInfo[]) {
    const dirPath = 'assets/data/maps'
    for await (const path of getFilesRecursive(dirPath)) {
        const name = isMapFileAndStripSuffix(path)?.slice(dirPath.length + 1)
        if (!name) continue
        dest.push({ name, path, source: 'base' })
    }
}

async function extensionMaps(dest: MapInfo[]) {
    const extensionsWithMaps = new Set(['fish-gear', 'flying-hedgehag', 'post-game', 'scorpion-robo', 'snowman-tank'])
    for (const ext in ig.extensions.enabled) {
        if (!extensionsWithMaps.has(ext)) continue
        const dirPath = `assets/extension/${ext}/data/maps`
        for await (const path of getFilesRecursive(dirPath)) {
            const name = isMapFileAndStripSuffix(path)?.slice(dirPath.length + 1)
            if (!name) continue
            dest.push({ name, path, source: 'extension', sourceDetails: ext })
        }
    }
}

async function modMaps(dest: MapInfo[], { modId, baseDirectory, assets }: ModInfoEntry) {
    for (let path of assets) {
        path = path.slice(baseDirectory.length)
        if (!path.startsWith('data/maps/')) continue
        path = path.slice('data/maps/'.length)
        const name = isMapFileAndStripSuffix(path)
        if (!name) continue
        dest.push({ name, path: baseDirectory + '/' + path, source: 'mod', sourceDetails: modId })
    }
}

interface ModInfoEntry {
    modId: string
    baseDirectory: string
    assets: string[]
}

function getModsInfo(): ModInfoEntry[] {
    // @ts-ignore
    const mods: Mod1[] = window.activeMods
    return mods.map(e => ({
        modId: 'name' in e ? e.name : e.id,
        baseDirectory: e.baseDirectory,
        assets: [...e.assets],
    }))
}

async function allModMaps(dest: MapInfo[]) {
    const mods = getModsInfo()
    return Promise.all(mods.map(entry => modMaps(dest, entry)))
}

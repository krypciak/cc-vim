import { VimLogic, AliasArguemntEntry } from '../logic.js'

declare const vim: VimLogic

export function addEntity() {
    vim.addAlias('cc-vim', 'spawn-entity', 'Spawn entity', 'ingame', (type: string, x?: string, y?: string, z?: string, settings?: string) => {
        const pos: Vec3 = ig.copy(ig.game.playerEntity.coll.pos)
        Vec3.add(pos, {
            x: x ? ((x.startsWith('-') || x.startsWith('+')) ? parseInt(x.substring(1)) : 0 ) : 0,
            y: y ? ((y.startsWith('-') || y.startsWith('+')) ? parseInt(y.substring(1)) : 0 ) : 0,
            z: z ? ((z.startsWith('-') || z.startsWith('+')) ? parseInt(z.substring(1)) : 0 ) : 0
        } as Vec3)
        ig.game.spawnEntity(type, pos.x, pos.y, pos.z, JSON.parse(settings ?? '{}'))
    }, [ { 
            type: 'string', description: 'Entity type', possibleArguments(): AliasArguemntEntry[] {
                const arr: AliasArguemntEntry[] = []
                for (const entity of Object.keys(ig.ENTITY)) {
                    const other: string[] = []
                    const keys = [ entity, ...other ]
                    arr.push({ value: entity, keys, display: keys })
                }
                return arr
            }, 
        },
            { type: 'number', description: 'x (Adding +/- makes it relative to the player)', },
            { type: 'number', description: 'y (Adding +/- makes it relative to the player)', },
            { type: 'number', description: 'z (Adding +/- makes it relative to the player)', },
            { type: 'object', description: 'Entity settings' },
    ])
}

import { VimLogic, AliasArguemntEntry } from '../logic.js'

declare const vim: VimLogic

export function addPlayer() {
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

    vim.addAlias('cc-vim', 'change-character', 'Change the playable character', 'ingame', (name: string) => {
        sc.model.player.setConfig(sc.party.models[name].config)
    }, [ { 
            type: 'string', description: 'Character name', possibleArguments(): AliasArguemntEntry[] {
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

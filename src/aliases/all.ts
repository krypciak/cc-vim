import { addGameAliases } from './game.js'
import { addPlayerAliases } from './player.js'
import { addEntityAliases } from './entity.js'
import { addOptionsAliases } from './options.js'

export function addAllAliases() {
    addGameAliases()
    addPlayerAliases()
    addEntityAliases()
    addOptionsAliases()
}

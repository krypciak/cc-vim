import { addGame } from './game.js'
import { addPlayer } from './player.js'
import { addEntity } from './entity.js'

export function addAllAliases() {
    addGame()
    addPlayer()
    addEntity()
}

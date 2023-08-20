import VimGui from './plugin.js'
import Fuse from "fuse.js"

declare const chrome: { runtime: { reload: () => void } }

interface Alias {
    origin: string
    name: string
    desc: string
    command: string | (() => void)
    condition: 'ingame' | 'global' | (() => boolean)
}

export class VimLogic {
    constructor(public gui: VimGui) {
        Object.assign(window, {vim: this})
        this.addAlias('cc-vim', 'reload', 'Reload the game without closing the window', 'global', () => { window.location.reload() })
        this.addAlias('cc-vim', 'reloadnl', 'Reload the game without memory leaks (closes the window)', 'global', () => { chrome ? chrome.runtime.reload() : window.location.reload() })

        this.addAlias('cc-vim', 'ppos', 'Prints player position', 'ingame', () => { console.log(ig.game.playerEntity ? ig.game.playerEntity.coll.pos : null) })
        this.addAlias('cc-vim', 'player', 'Prints player entity', 'ingame', () => { console.log(ig.game.playerEntity) })
    }
    
    fuseOptions: Fuse.IFuseOptions<Alias> = {
        isCaseSensitive: false,
        includeScore: true,
        shouldSort: true,
        includeMatches: true,
        findAllMatches: false,
        minMatchCharLength: 1,
        location: 0,
        threshold: 0.4,
        distance: 100,
        useExtendedSearch: false,
        ignoreLocation: false,
        ignoreFieldNorm: false,
        fieldNormWeight: 1,
        keys: [
               { name: 'origin', weight: 0.3 },
               { name: 'name', weight: 0.7 },
               { name: 'desc', weight: 0.3 }
        ],
    }
    completionThreshold: number = 0.3
    fuse!: Fuse<Alias>
    suggestions!: Fuse.FuseResult<Alias>[]
    
    aliasesMap: Map<string, string | (() => void)> = new Map()
    aliases: Alias[] = []

    addAlias(origin: string, name: string, desc: string, condition: 'ingame' | 'global' | (() => boolean), command: string | (() => void)) {
        const alias: Alias = { origin, name, desc, condition, command }
        this.aliases.push(alias)
        this.aliasesMap.set(alias.name, alias.command)
    }
    
    updateAliases(options: Fuse.IFuseOptions<Alias> = this.fuseOptions) {
        this.fuse = new Fuse(this.aliases, options)
    }

    getPossibleAliases(): Alias[] {
        const suggestions: Alias[] = []
        this.aliases.forEach(a => suggestions.push(a))
        // @ts-expect-error ig.game.maps not in typedefes
        const ingame: boolean = ig.game.maps.length == 0

        return suggestions.filter(a => {
            if (typeof a.condition == 'string') {
                return a.condition == 'global' || ingame
            } else {
                return a.condition()
            }
        })
    }

    private search(input: string, includeAll: boolean = false): Fuse.FuseResult<Alias>[] {
        let options = this.fuseOptions
        if (includeAll) {
            options = ig.copy(options)
            options.threshold = 1

        }
        const suggestions = this.suggestions = this.fuse.search(input)
        return suggestions
    }
    
    execute(cmd: string | (() => void), fallback = false): boolean {
        if (! cmd) { return false }
        if (typeof cmd === 'function') {
            cmd()
            return true
        }
        const split: string[] = cmd.split(' ')
        const base: string = split[0].toLowerCase()

        let toExec: string | (() => void) = cmd
        if (this.aliasesMap.has(base)) {
            toExec = this.aliasesMap.get(base)!
        }
        try {
            if (typeof toExec === 'string') {
                (0, eval)(toExec)
            } else {
                toExec()
            }
            return true
        } catch (e: any) {
            const item = this.suggestions[0]
            if (fallback && item.score! < this.completionThreshold) {
                return this.execute(item.item.command)
            } else {
                console.log(e)
                return false
            }
        }
    }

    keyEvent(event: KeyboardEvent) {
        if (event.key == 'Enter') {
            this.execute(this.gui.input.value.trim(), true)
            this.gui.input.value = ''
            this.gui.hide()
        } else if (event.key == ';' || event.key == 'Escape') {
            this.gui.hide()
        } else {
            this.autocomplete()
        }
    }

    autocomplete() {
        // clear previous suggestions
        this.gui.suggestionTable.innerHTML = ''
        
        const inputValue = this.gui.input.value.toLowerCase()
        const suggestions: Fuse.FuseResult<Alias>[] = inputValue == '?' ? : this.search(inputValue)

        const table: HTMLTableElement = document.getElementById('suggestionTable') as HTMLTableElement

        for (let i = 0; i < suggestions.length; i++) {
            const searchResult = suggestions[i]
            const alias: Alias = searchResult.item

            const tr = table.insertRow()
            const commandString: string = typeof alias.command == 'string' ? alias.command : alias.command.toString().slice(8).replace(/ }$/, '')
            const rowData: string[] = [ alias.origin, alias.name, alias.desc, commandString ]
            for (const entry of rowData) {
                const cell = tr.insertCell()
                cell.style.paddingRight = '20px'
                cell.style.whiteSpace = 'nowrap'
                cell.textContent = entry
            }

            if (i == 0) {
                const score: number = searchResult.score!
                if (score < this.completionThreshold) {
                    tr.style.backgroundColor = 'blue'
                } else {
                    tr.style.backgroundColor = ''
                }
            }
        
            tr.addEventListener('click', () => {
                  this.gui.input.value = alias.name
                  this.gui.suggestionTable.innerHTML = ''
            })
        }
    }
}

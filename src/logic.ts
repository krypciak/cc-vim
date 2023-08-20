import VimGui from './plugin.js'
import Fuse from 'fuse.js'
import { addBaseAliases } from './aliases.js'

interface Alias {
    origin: string
    name: string
    desc: string
    command: string | ((...args: string[]) => void)
    condition: 'ingame' | 'global' | 'titlemenu' | ((ingame: boolean) => boolean)
}

export class VimLogic {
    constructor(public gui: VimGui) {
        Object.assign(window, {vim: this})
        addBaseAliases()
    }
    
    fuseOptions: Fuse.IFuseOptions<Alias> = {
        isCaseSensitive: false,
        includeScore: true,
        includeMatches: true,
        minMatchCharLength: 1,
        shouldSort: true,
        findAllMatches: true,
        keys: [
            { name: 'origin', weight: 1 },
            { name: 'name', weight: 1 },
            { name: 'desc', weight: 0.3 }
        ],
        ignoreLocation: true,
        useExtendedSearch: true,
        ignoreFieldNorm: true,
        threshold: 1,
        fieldNormWeight: 1,
    }
    completionThreshold: number = 1
    fuse!: Fuse<Alias>
    suggestions!: Fuse.FuseResult<Alias>[]
    
    aliasesMap: Map<string, string | ((...args: string[]) => void)> = new Map()
    aliases: Alias[] = []


    addAlias(origin: string, name: string, desc: string, condition: 'ingame' | 'global' | 'titlemenu' | ((ingame: boolean) => boolean), command: string | ((...args: string[]) => void)) {
        const alias: Alias = { origin, name, desc, condition, command }
        this.aliases.push(alias)
        this.aliasesMap.set(alias.name, alias.command)
    }
    
    updateAliases(aliases: Alias[] = this.aliases, options: Fuse.IFuseOptions<Alias> = this.fuseOptions) {
        this.fuse = new Fuse(aliases, options)
    }

    getPossibleAliases(): Alias[] {
        const suggestions: Alias[] = []
        this.aliases.forEach(a => suggestions.push(a))
        // @ts-expect-error ig.game.maps not in typedefes
        const ingame: boolean = ig.game.maps.length != 0

        return suggestions.filter(a => {
            if (typeof a.condition == 'string') {
                switch (a.condition) {
                    case 'global': return true
                    case 'ingame': return ingame
                    case 'titlemenu': return ! ingame
                }
            } else {
                return a.condition(ingame)
            }
        })
    }

    private search(base: string): Fuse.FuseResult<Alias>[] {
        const suggestions = this.suggestions = this.fuse.search(base)
        return suggestions
    }
    
    execute(cmd: string | ((...args: string[]) => void), fallback = false, args: string[] = []): boolean {
        if (! cmd) { return false }
        if (typeof cmd === 'function') {
            cmd(...args)
            return true
        }
        const split: string[] = cmd.split(' ')
        const base: string = split[0].toLowerCase()
        split.shift()

        let toExec: string | ((...args: string[]) => void) = cmd
        if (! fallback && this.aliasesMap.has(base)) {
            toExec = this.aliasesMap.get(base)!
        }
        try {
            if (typeof toExec === 'string') {
                (0, eval)(toExec)
            } else {
                toExec(...split)
            }
            return true
        } catch (e: any) {
            const item = this.suggestions[0]
            if (fallback && item && item.score && item.score < this.completionThreshold) {
                return this.execute(item.item.command, false, split)
            } else {
                ig.error('Invalid command')
                console.log(e)
                return false
            }
        }
    }

    inputEvent(event: InputEvent) {
        this.autocomplete((event.target as HTMLInputElement).value)
    }

    tab() {
        this.gui.input.value = this.suggestions[0].item.name + ': '
    }

    autocomplete(inputValue: string) {
        // clear previous suggestions
        const table: HTMLTableElement = this.gui.suggestionTable
        table.innerHTML = ''
        
        inputValue = inputValue.toLowerCase()
        const cursorPosition: number = this.gui.input.selectionStart!
        let baseEndPos = inputValue.indexOf(':')
        if (baseEndPos == -1) {
            baseEndPos = inputValue.length
        }
        const isBase: boolean = baseEndPos >= cursorPosition
        const baseStr = inputValue.substring(0, baseEndPos)

        let suggestions: Fuse.FuseResult<Alias>[] = this.search(baseStr)

        if (! isBase && suggestions) {
            const selectedBase = suggestions[0]
            if (selectedBase && selectedBase.score! < this.completionThreshold) {
                this.suggestions = suggestions = [ suggestions[0] ]
            }
        }

        for (let i = 0; i < Math.min(5, suggestions.length); i++) {
            const searchResult = suggestions[i]
            const alias: Alias = searchResult.item

            const tr = table.insertRow()
            const rowData: string[] = [ alias.origin, alias.name, alias.desc, alias.command.toString() ]
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

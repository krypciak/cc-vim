import VimGui from './plugin.js'
import Fuse from 'fuse.js'
import { addBaseAliases } from './aliases.js'

interface Alias {
    origin: string
    name: string
    desc: string
    command: string | ((...args: string[]) => void)
    condition: 'ingame' | 'global' | 'titlemenu' | ((ingame: boolean) => boolean)
    keys: string[]
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
        keys: [ 'keys' ],
        ignoreLocation: true,
        useExtendedSearch: false,
        ignoreFieldNorm: false,
        threshold: 1,
        fieldNormWeight: 1,
    }
    completionThreshold: number = 1
    fuse!: Fuse<Alias>
    suggestions!: Fuse.FuseResult<Alias>[]
    
    aliasesMap: Map<string, string | ((...args: string[]) => void)> = new Map()
    aliases: Alias[] = []


    addAlias(origin: string, name: string, desc: string, condition: 'ingame' | 'global' | 'titlemenu' | ((ingame: boolean) => boolean), command: string | ((...args: string[]) => void)) {
        const alias: Alias = { origin, name, desc, condition, command, keys: [ origin, name, desc ] }
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
    
    execute(cmd: string | ((...args: string[]) => void), fallback = false, funcArgs: string[] = []): boolean {
        if (! cmd) { return false }
        if (typeof cmd === 'function') {
            cmd(...funcArgs)
            return true
        }
        const split: string[] = cmd.split(' ')
        const baseEndIndex = cmd.indexOf(':')
        let base: string = '', args: string[] = []
        if (baseEndIndex == -1) {
            if (split.length == 1) {
                base = cmd
            } else if (! fallback) {
                throw new Error('invalid command')
            }
        } else {
            base = cmd.substring(0, baseEndIndex)
            args = cmd.substring(baseEndIndex+1).trim().split(' ')
            debugger
        }

        let exec: string | ((...args: string[]) => void) | null = null
        if (base && this.aliasesMap.has(base)) {
            exec = this.aliasesMap.get(base)!
        }
        if (exec) {
            try {
                if (typeof exec === 'string') {
                    (0, eval)(exec)
                } else {
                    exec(...args)
                }
                return true
            } catch (e: any) {
                console.log(e)
                return false
            }
        } else if (fallback) {
            const item = this.suggestions[0]
            if (item && item.score! < this.completionThreshold) {
                return this.execute(item.item.command, false, args)
            }
        }
        throw new Error('how')
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

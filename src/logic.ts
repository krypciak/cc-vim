import VimGui from './plugin.js'
import Fuse from "fuse.js"

export class VimLogic {
    constructor(public gui: VimGui) {
        Object.assign(window, {vim: this})
        this.addAlias('cc-vim', 'reload', 'Reload the game without closing the window', 'window.location.reload()')
        this.addAlias('cc-vim', 'reloadnl', 'Reload the game without memory leaks (closes the window)', 'chrome ? chrome.runtime.reload() : window.location.reload()')
        this.addAlias('cc-vim', 'ppos', 'Prints player position', 'console.log(ig.game.playerEntity ? ig.game.playerEntity.coll.pos : null)')
        this.addAlias('cc-vim', 'player', 'Prints player entity', 'console.log(ig.game.playerEntity)')
    }
    
    fuseOptions: Fuse.IFuseOptions<unknown> = {
        isCaseSensitive: false,
        includeScore: true,
        shouldSort: true,
        includeMatches: false,
        findAllMatches: false,
        minMatchCharLength: 1,
        location: 0,
        threshold: 0.6,
        distance: 100,
        useExtendedSearch: false,
        ignoreLocation: false,
        ignoreFieldNorm: false,
        fieldNormWeight: 1,
        keys: [''],
    }
    completionThreshold: number = 0.3
    fuse!: Fuse<string>
    suggestions!: Fuse.FuseResult<string>[]
    
    aliases: Map<string, string | (() => void)> = new Map()
    aliasesKeys: string[] = []

    addAlias(origin: string, name: string, desc: string, command: string | (() => void)) {
        this.aliases.set(name, command)
        this.aliasesKeys.push(name)
    }
    
    updateAliases() {
        this.fuse = new Fuse(this.aliasesKeys, this.fuseOptions)
    }

    private search(input: string): Fuse.FuseResult<string>[] {
        const suggestions = this.suggestions = this.fuse.search(input)
        return suggestions
    }
    
    execute(cmd: string, fallback = false): boolean {
        if (! cmd) {
            return false
        }
        const split: string[] = cmd.split(' ')
        const base: string = split[0].toLowerCase()

        let toExec: string | (() => void) = cmd
        if (this.aliases.has(base)) {
            toExec = this.aliases.get(base)!
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
                return this.execute(item.item)
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
        this.gui.suggestions.innerHTML = ''
        
        const inputValue = this.gui.input.value.toLowerCase()
        const suggestions: Fuse.FuseResult<string>[] = this.search(inputValue)

        for (let i = 0; i < suggestions.length; i++) {
            const str: string = suggestions[i].item
            const suggestionElement: HTMLElement = document.createElement('div')
            if (i == 0) {
                const score: number = suggestions[i].score!
                if (score < this.completionThreshold) {
                    suggestionElement.style.backgroundColor = 'blue'
                } else {
                    suggestionElement.style.backgroundColor = ''
                }
            }

            suggestionElement.textContent = str
        
            suggestionElement.addEventListener('click', () => {
                  this.gui.input.value = str
                  this.gui.suggestions.innerHTML = ''
            })

            this.gui.suggestions.appendChild(suggestionElement)
        }
    }
}

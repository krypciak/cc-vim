import Fuse from 'fuse.js'

export class SuggestionTable<T extends { keys: string[], display: string[] }> {
    fuse!: Fuse<T>
    fuseOptions: Fuse.IFuseOptions<T> = {
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
    suggestions!: Fuse.FuseResult<T>[]

    constructor(
        public table: HTMLTableElement,
        public values: T[],
    ) {
        this.updateValues()
    }

    updateValues() {
        this.fuse = new Fuse(this.values, this.fuseOptions)
    }

    search(base: string): Fuse.FuseResult<T>[] {
        return this.suggestions = this.fuse.search(base)
    }

    getSelectedSuggestion(): Fuse.FuseResult<T> {
        return this.suggestions[0]
    }

    inputEvent(event: { target: EventTarget | null }, cursorPosition: number) {
        const input = (event.target as HTMLInputElement)
        this.autocomplete(input.value, cursorPosition)
    }

    autocomplete(inputStr: string, cursorPosition: number) {
        const table: HTMLTableElement = this.table
        table.innerHTML = ''
        
        if (inputStr.startsWith('!')) {
            return
        }
        // silence the not used info
        if (cursorPosition) {}

        let suggestions: Fuse.FuseResult<T>[] = this.suggestions = this.search(inputStr)
        if (this.suggestions.length == 0 && inputStr.trim() == '') {
            suggestions = this.values.map(v => ({ score: 1, item: v, matches: undefined, refIndex: 0 } as Fuse.FuseResult<T>))
        }

        for (let i = 0; i < Math.min(20, suggestions.length); i++) {
            const searchResult = suggestions[i]
            const value: T = searchResult.item

            const tr = table.insertRow()
            for (const entry of value.display) {
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
        }
    }
}

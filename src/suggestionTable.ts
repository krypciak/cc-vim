// @ts-ignore when you import this from a different ts project, it complains that fuse.js is missing
import Fuse from 'fuse.js'

export class SuggestionTable<T extends { keys: string[], display: string[] }> {
    fuse!: Fuse<T>
    fuseOptions: Fuse.IFuseOptions<T> = {
        isCaseSensitive: false,
        includeScore: true,
        minMatchCharLength: 1,
        shouldSort: true,
        findAllMatches: true,
        keys: [ 'keys' ],
        ignoreLocation: true,
        useExtendedSearch: false,
        ignoreFieldNorm: false,
        fieldNormWeight: 1,
    }
    completionThreshold: number = 1
    suggestions!: Fuse.FuseResult<T>[]
    selectedSuggestion: number = 0

    constructor(
        public table: HTMLTableElement,
        public values: T[],
        threshold: number = 1,
        completionThreshold: number = 1,
        public maxResults: number = 20,
        includeMatches: boolean = true,
    ) {
        this.updateValues()
        this.fuseOptions.threshold = threshold
        this.completionThreshold = completionThreshold
        this.fuseOptions.includeMatches = includeMatches
    }

    updateValues() {
        this.fuse = new Fuse(this.values, this.fuseOptions)
    }

    search(base: string): Fuse.FuseResult<T>[] {
        if (! base) { return [] }
        return this.suggestions = this.fuse.search(base)
    }

    getSelectedSuggestion(): Fuse.FuseResult<T> {
        return this.suggestions[this.selectedSuggestion]
    }

    inputEvent(input: string, cursorPosition: number) {
        this.autocomplete(input, cursorPosition)
    }

    autocomplete(inputStr: string, cursorPosition: number, noSearch: boolean = false) {
        const table: HTMLTableElement = this.table
        table.innerHTML = ''

        // silence the not used info
        if (cursorPosition) {}

        let suggestions: Fuse.FuseResult<T>[]
        if (noSearch) {
            suggestions = this.suggestions
        } else {
            suggestions = this.suggestions = this.search(inputStr)
            if (this.suggestions.length == 0 && inputStr.trim() == '') {
                suggestions = this.suggestions = this.values.map(v => ({ score: 1, item: v, matches: undefined, refIndex: 0 } as Fuse.FuseResult<T>))
            }
        }

        for (let i = 0; i < Math.min(this.maxResults, suggestions.length); i++) {
            const searchResult = suggestions[i]
            const value: T = searchResult.item

            const tr = table.insertRow()
            for (const entry of value.display) {
                const cell = tr.insertCell()
                cell.style.paddingRight = '20px'
                cell.style.whiteSpace = 'nowrap'
                cell.textContent = entry
            }

            if (i == this.selectedSuggestion) {
                const score: number = searchResult.score!
                if (score <= this.completionThreshold) {
                    tr.style.backgroundColor = 'blue'
                } else {
                    tr.style.backgroundColor = ''
                }
            }
        }
    }
}

import { VimLogic, Alias, AliasArguemnt, AliasArguemntEntry } from './logic.js'
import { SuggestionTable } from './suggestionTable.js'
const fs: {
    writeFile(path: string, content: string, encoding: string, callback: (err: any) => void): void
    readFileSync(path: string): string
} = require('fs')

export class MainSuggestionTable extends SuggestionTable<Alias> {
    currentArgTables!: SuggestionTable<AliasArguemntEntry>[] | null
    fs: any
    history!: { [key: string]: number }
    historySuggestionTable!: SuggestionTable<{ keys: string[]; display: string[] }>
    historyIndex: number = 10000

    constructor(
        public input: HTMLInputElement,
        public table: HTMLTableElement,
        public argTable: HTMLTableElement,
        public historyTable: HTMLTableElement,
        public argTypeTable: HTMLTableElement,
        public logic: VimLogic,
        public historyFile: string
    ) {
        super(table, [])
        this.loadHistory()
    }

    getArgPos(args: string[], pos: number): number {
        let wordIndex = 0
        for (const word of args) {
            if (pos <= word.length) {
                break
            }
            wordIndex++
            pos -= word.length + VimLogic.argSplit.length
        }
        return wordIndex
    }

    autocomplete(inputValue: string, cursorPosition: number, noSearch: boolean = false, noHistorySearch = false) {
        this.historySuggestionTable.autocomplete(inputValue, cursorPosition, noHistorySearch)

        if (inputValue.startsWith('!')) {
            this.table.innerHTML = ''
            this.argTypeTable.innerHTML = ''
            this.argTable.innerHTML = ''
            return
        }

        let baseEndIndex = inputValue.indexOf(':')
        if (baseEndIndex == -1) {
            baseEndIndex = inputValue.length + 1
        }

        const base = inputValue.substring(0, baseEndIndex)
        super.autocomplete(base, cursorPosition, noSearch)

        const isBase = cursorPosition <= baseEndIndex
        if (this.suggestions.length > 0) {
            if (!isBase) {
                while (this.table.rows.length > 1) {
                    this.table.deleteRow(1)
                }
                const { args } = this.logic.decomposeCommandString(inputValue, true)
                cursorPosition--
                const argPos = this.getArgPos(args, cursorPosition - baseEndIndex)
                const alias: Alias = this.suggestions[0].item

                this.argTypeTable.innerHTML = ''
                this.argTable.innerHTML = ''
                if (alias.arguments.length > argPos) {
                    const arg: AliasArguemnt = alias.arguments[argPos]

                    this.argTypeTable.innerHTML = '<br>'
                    const tr = this.argTypeTable.insertRow()
                    const display: string[] = ['arg' + argPos + ' type: ' + arg.type, arg.description]
                    for (const entry of display) {
                        const cell = tr.insertCell()
                        cell.style.paddingRight = '20px'
                        cell.style.whiteSpace = 'nowrap'
                        cell.textContent = entry
                    }

                    if (!this.currentArgTables) {
                        this.currentArgTables = []
                    }
                    // arg.possibleArguments cant be a function here
                    if (arg.possibleArguments && typeof arg.possibleArguments !== 'function') {
                        this.currentArgTables[argPos] = new SuggestionTable<AliasArguemntEntry>(this.argTable, arg.possibleArguments)
                    }
                    this.currentArgTables[argPos]?.autocomplete(args[argPos] ?? '', 0)
                }
            } else {
                this.argTypeTable.innerHTML = ''
                this.argTable.innerHTML = ''
                this.currentArgTables = null
            }
        }
    }

    inputEvent(input: string, cursorPosition: number) {
        this.autocomplete(input, cursorPosition)
    }

    updateHistoryTable() {
        const entries: { keys: string[]; display: string[] }[] = Object.entries(this.history)
            .sort((e1, e2) => e2[1] - e1[1])
            .map(e => {
                const cmd: string = e[0]
                // const timesUsed: number = e[1]
                return { keys: [cmd], display: [cmd] }
            })
        this.historySuggestionTable = new SuggestionTable(this.historyTable, entries, 0.5, 1, 1000, false)

        this.historySuggestionTable.selectedSuggestion = 10000
    }

    arrowInputEvent(input: string, cursorPosition: number, dir: -1 | 1) {
        let val = this.historySuggestionTable.selectedSuggestion
        val += dir
        const len = this.historySuggestionTable.suggestions.length == 0 ? this.historySuggestionTable.values.length : this.historySuggestionTable.suggestions.length

        if (val < 0) {
            val = len - 1
        } else if (val >= len) {
            val = 0
        }
        this.historySuggestionTable.selectedSuggestion = val
        this.historySuggestionTable.autocomplete(input, cursorPosition, true)
        this.input.value = input = this.historySuggestionTable.getSelectedSuggestion().item.display[0]
        this.autocomplete(input, cursorPosition, false, true)
    }

    enter(input: string) {
        if (input in this.history) {
            this.history[input]++
        } else if (input.trim() != '') {
            this.history[input] = 1
        }
        this.saveHistory()
    }

    saveHistory() {
        fs.writeFile(this.historyFile, JSON.stringify(this.history), 'utf8', err => {
            if (err) {
                console.error(err)
            }
        })
    }

    loadHistory() {
        try {
            this.history = JSON.parse(fs.readFileSync(this.historyFile))
        } catch (e) {
            this.history = {}
        }
        this.updateHistoryTable()
    }
}

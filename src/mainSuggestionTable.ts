import { VimLogic, type Alias, type AliasArguemnt, type AliasArguemntEntry } from './logic'
import { SuggestionTable } from './suggestionTable'

export class MainSuggestionTable extends SuggestionTable<Alias> {
    currentArgTables!: SuggestionTable<AliasArguemntEntry>[] | null

    constructor(
        public input: HTMLInputElement,
        public table: HTMLTableElement,
        public argTable: HTMLTableElement,
        public historyTable: HTMLTableElement,
        public argTypeTable: HTMLTableElement,
        public logic: VimLogic
    ) {
        super(table, [])
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

    async autocomplete(inputValue: string, cursorPosition: number, noSearch: boolean = false) {
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
                    const possibleArguments = await this.populateAliasPossibleArguments(alias, arg, argPos)
                    if (possibleArguments) {
                        this.currentArgTables[argPos] = new SuggestionTable<AliasArguemntEntry>(
                            this.argTable,
                            possibleArguments
                        )
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

    private async populateAliasPossibleArguments(
        alias: Alias,
        arg: AliasArguemnt,
        argPos: number
    ): Promise<AliasArguemntEntry[] | undefined> {
        if (arg.possibleArguments) {
            if (typeof arg.possibleArguments === 'function') {
                alias.arguments[argPos] = ig.copy(arg)
                try {
                    return (alias.arguments[argPos].possibleArguments = arg.possibleArguments())
                } catch (e) {
                    console.error('error while evaluating possibleArguments of alias', alias.name, e)
                }
            } else {
                return arg.possibleArguments
            }
        }
    }

    inputEvent(input: string, cursorPosition: number) {
        this.autocomplete(input, cursorPosition)
    }

    arrowInputEvent(input: string, cursorPosition: number, dir: -1 | 1) {
        const suggestionTable = this.currentArgTables?.last() ?? this
        if (!suggestionTable) return

        const suggestionCount = suggestionTable.values.length
        const maxViewOffset = suggestionCount - this.maxResults

        let val = suggestionTable.selectedSuggestion + dir
        if (val < 0) val = suggestionCount - 1
        else if (val >= suggestionCount) val = 0

        suggestionTable.selectedSuggestion = val
        suggestionTable.viewScroll = Math.max(0, Math.min(maxViewOffset, val - 5))
        suggestionTable.autocomplete(input, cursorPosition, true)
    }
}

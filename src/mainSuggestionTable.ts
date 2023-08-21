import { VimLogic, Alias, AliasArguemnt, AliasArguemntEntry } from './logic.js'
import { SuggestionTable } from './suggestionTable.js'


export class MainSuggestionTable extends SuggestionTable<Alias> {
    currentArgTables!: SuggestionTable<AliasArguemntEntry>[] | null

    constructor(
        public table: HTMLTableElement,
        public argTable: HTMLTableElement,
        public argTypeTable: HTMLTableElement,
        public logic: VimLogic,
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

    autocomplete(inputValue: string, cursorPosition: number) {
        let baseEndIndex = inputValue.indexOf(':') 
        if (baseEndIndex == -1) { baseEndIndex = inputValue.length + 1 }

        const base = inputValue.substring(0, baseEndIndex)
        super.autocomplete(base, cursorPosition)

        const isBase = cursorPosition <= baseEndIndex
        if (this.suggestions.length > 0) {
            if (! isBase) {
                while (this.table.rows.length > 1) {
                  this.table.deleteRow(1)
                }
                const { args } = this.logic.decomposeCommandString(inputValue, true)
                cursorPosition--
                const argPos = this.getArgPos(args, cursorPosition - baseEndIndex)
                const alias: Alias = this.suggestions[0].item
                if (alias.arguments.length > argPos) {
                    const arg: AliasArguemnt = alias.arguments[argPos]

                    this.argTypeTable.innerHTML = '<br>'
                    const tr = this.argTypeTable.insertRow()
                    const display: string[] = [ 'arg' + argPos + ' type: ' + arg.type, arg.description ]
                    for (const entry of display) {
                        const cell = tr.insertCell()
                        cell.style.paddingRight = '20px'
                        cell.style.whiteSpace = 'nowrap'
                        cell.textContent = entry
                    }

                    if (! this.currentArgTables) { this.currentArgTables = [] }
                    // arg.possibleArguments cant be a function here
                    if (arg.possibleArguments && typeof arg.possibleArguments !== 'function') {
                        this.currentArgTables[argPos] = new SuggestionTable<AliasArguemntEntry>(this.argTable, arg.possibleArguments)
                    }
                    this.currentArgTables[argPos]?.autocomplete(args[argPos], 0)
                } else {
                    this.argTypeTable.innerHTML = ''
                    this.argTable.innerHTML = ''
                }
            } else {
                this.argTypeTable.innerHTML = ''
                this.argTable.innerHTML = ''
                this.currentArgTables = null
            }
        }
    }

    inputEvent(event: { target: EventTarget | null }, cursorPosition: number) {
        const input = (event.target as HTMLInputElement)
        this.autocomplete(input.value, cursorPosition)
    }
 
}



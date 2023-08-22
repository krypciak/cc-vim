import { InputKey, KeyBinder } from './keybinder.js'
import { VimLogic } from './logic.js'
import { MainSuggestionTable } from './mainSuggestionTable.js'
const fs: { existsSync(path: string): boolean, mkdirSync(path: string): void } = require('fs')

export default class VimGui {
    dir: string
    keybinder: KeyBinder = new KeyBinder()
    visible: boolean = false
    block!: HTMLElement
    historyBlock!: HTMLElement
    input!: HTMLInputElement
    historyTable!: HTMLTableElement
    suggestionTable!: HTMLTableElement
    suggestionArgType!: HTMLTableElement
    suggestionArgTable!: HTMLTableElement
    logic: VimLogic = new VimLogic(this)
    mst!: MainSuggestionTable

    constructor(mod: { baseDirectory: string }) {
        this.dir = mod.baseDirectory
    }

    async prestart() {
        const kb = this.keybinder
        kb.addKey(new InputKey(
            ig.KEY.SEMICOLON, 'openvim', 'Open vim command prompt', sc.OPTION_CATEGORY.CONTROLS, true, 'vim', () => { this.show() }, this, true))
        kb.bind()

        this.addInjects()

        if (! fs.existsSync('assets/mod-data')) { fs.mkdirSync('assets/mod-data') }
        if (! fs.existsSync('assets/mod-data/cc-vim')) { fs.mkdirSync('assets/mod-data/cc-vim') }
    }

    async poststart() {
        const kb = this.keybinder
        kb.addHeader('vim', 'vim')
        kb.updateLabels()
    }

    addInjects() {
        const self = this
        ig.Gui.inject({
			init(...args) {
				this.parent(...args);
				
				document.body.insertAdjacentHTML('beforeend',`
                    <div id="vimHistory"
						style="
							display: none;
							position: absolute;
							top: 43%;
                            left: 1%;
							width: 9%;
							background: rgba(0, 0, 0, 1);
							color: white;
                            font-size: 150%;
							display: block;
                        ">
                    <table id="historyTable" style="
                        border-collapse: collapse;
                    "></table>
                    </div>
					<div id="vim"
						style="
							display: none;
							position: absolute;
							top: 40%;
                            left: 10%;
							width: 89%;
							background: rgba(0, 0, 0, 1);
							color: white;
                            font-size: 150%;
							display: block;
                        ">
						<input id="viminput" autocomplete="off" style="
                            background: rgba(0, 0, 0, 1);
                            font-size: 150%;
							width: 100%;
                        ">
                        <table id="suggestionTable" style="
                            border-collapse: collapse;
                        "></table>
                        <table id="suggestionArgType" style="
                            border-collapse: collapse;
                            left: 5%;
                        "></table>
                        <table id="suggestionArgTable" style="
                            border-collapse: collapse
                            left: 5%;
                        "></table>
					</div>
				`)

                self.historyBlock = document.getElementById('vimHistory')!
				self.block = document.getElementById('vim')!
                const input = self.input = document.getElementById('viminput') as HTMLInputElement
                self.historyTable = document.getElementById('historyTable') as HTMLTableElement
                self.suggestionTable = document.getElementById('suggestionTable') as HTMLTableElement
                self.suggestionArgType = document.getElementById('suggestionArgType') as HTMLTableElement
                self.suggestionArgTable = document.getElementById('suggestionArgTable') as HTMLTableElement

                input.addEventListener('keydown', (e: KeyboardEvent) => { self.keyEvent(e) })
                input.addEventListener('input', (e: any) => { self.mst.inputEvent(e.target.value, self.input.selectionStart!) })
                self.hide()
			}
		});
    }

    keyEvent(event: KeyboardEvent) {
        const target = event.target as HTMLInputElement
        if (event.key == 'Enter') {
            event.preventDefault()
            const cmd = target.value.trim()
            this.mst.enter(cmd)
            this.logic.executeFromInput(cmd,
                this.mst.suggestions[0]?.item, this.mst.currentArgTables?.map(t => t?.suggestions[0]?.item))
            this.input.value = ''
            this.hide()
        } else if (event.key == ';' || event.key == 'Escape') {
            this.hide()
        } else if (event.key == 'Tab') {
            event.preventDefault()
        } else if (event.key == 'ArrowLeft' || event.key == 'ArrowRight') {
            this.mst.inputEvent(target.value, this.input.selectionStart! + (event.key == 'ArrowLeft' ? -1 : 1))
            this.mst.historySuggestionTable.selectedSuggestion = -1
        } else if (event.key == 'ArrowUp' || event.key == 'ArrowDown') {
            event.preventDefault()
            this.mst.arrowInputEvent(target.value, this.input.selectionStart!, event.key == 'ArrowUp' ? 1 : -1)
        } else {
            this.mst.historySuggestionTable.selectedSuggestion = -1
        }

    }

    hide() {
        this.visible = false
        this.block.style.display = 'none'
        this.historyBlock.style.display = 'none'
        document.getElementById('game')!.focus()
    }

    show() {
        this.visible = true
        this.block.style.display = 'block'
        this.historyBlock.style.display = 'block'
        this.input.value = ''
        this.suggestionTable.innerHTML = ''
        this.suggestionArgType.innerHTML = ''
        this.suggestionArgTable.innerHTML = ''
        this.input.focus()
        if (! this.mst) {
            this.mst = new MainSuggestionTable(this.input, this.suggestionTable, this.suggestionArgTable,
                this.historyTable, this.suggestionArgType, this.logic, 'assets/mod-data/cc-vim/history.json')
        }
        this.mst.values = this.logic.getPossibleAliases()
        this.mst.updateValues()
        this.mst.autocomplete('', 0)
    }
}

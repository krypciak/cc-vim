import { InputKey, KeyBinder } from './keybinder.js'
import { VimLogic } from './logic.js'
import { MainSuggestionTable } from './mainSuggestionTable.js'

export default class VimGui {
    dir: string
    keybinder: KeyBinder = new KeyBinder()
    visible: boolean = false
    block!: HTMLElement
    input!: HTMLInputElement
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
    }

    async main() {
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
					<div id="vim"
						style="
							display: none;
							position: absolute;
							top: 40%;
                            left: 5%;
							width: 90%;
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

				self.block = document.getElementById('vim')!
                const input = self.input = document.getElementById('viminput') as HTMLInputElement
                self.suggestionTable = document.getElementById('suggestionTable')! as HTMLTableElement
                self.suggestionArgType = document.getElementById('suggestionArgType')! as HTMLTableElement
                self.suggestionArgTable = document.getElementById('suggestionArgTable')! as HTMLTableElement

                input.addEventListener('keydown', (e: KeyboardEvent) => { self.keyEvent(e) })
                input.addEventListener('input', (e: any) => { self.mst.inputEvent(e, self.input.selectionStart!) })
                self.hide()
			}
		});
    }

    keyEvent(event: KeyboardEvent) {
        if (event.key == 'Enter') {
            event.preventDefault()
            this.logic.executeFromInput((event.target as HTMLInputElement).value.trim(),
                this.mst.suggestions[0]?.item, this.mst.currentArgTables?.map(t => t?.suggestions[0]?.item))
            this.input.value = ''
            this.hide()
        } else if (event.key == ';' || event.key == 'Escape') {
            this.hide()
        } else if (event.key == 'Tab') {
            event.preventDefault()
        } else if (event.key == 'ArrowLeft' || event.key == 'ArrowRight') {
            this.mst.inputEvent(event, this.input.selectionStart! + (event.key == 'ArrowLeft' ? -1 : 1))
        }
    }

    hide() {
        this.visible = false
        this.block.style.display = 'none'
        document.getElementById('game')!.focus()
    }

    show() {
        this.visible = true
        this.block.style.display = 'block'
        this.input.value = ''
        this.suggestionTable.innerHTML = ''
        this.suggestionArgType.innerHTML = ''
        this.suggestionArgTable.innerHTML = ''
        this.input.focus()
        if (! this.mst) {
            this.mst = new MainSuggestionTable(this.suggestionTable, this.suggestionArgTable, this.suggestionArgType, this.logic)
        }
        this.mst.values = this.logic.getPossibleAliases()
        this.mst.updateValues()
        this.mst.autocomplete('', 0)
    }
}

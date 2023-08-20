import { InputKey, KeyBinder } from './keybinder.js'
import { VimLogic } from './logic.js'

export default class VimGui {
    dir: string
    keybinder: KeyBinder = new KeyBinder()
    visible: boolean = false
    block!: HTMLElement
    input!: HTMLInputElement
    suggestionTable!: HTMLTableElement
    suggestionArgTable!: HTMLTableElement
    logic: VimLogic = new VimLogic(this)

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
                            border-collapse: collapse
                        "></table>
					</div>
				`)

				self.block = document.getElementById('vim')!
                const input = self.input = document.getElementById('viminput') as HTMLInputElement
                self.suggestionTable = document.getElementById('suggestionTable')! as HTMLTableElement

                input.addEventListener('keydown', (e: KeyboardEvent) => { self.keyEvent(e) })
                input.addEventListener('input', (e: any) => { self.logic.inputEvent(e) })
                self.hide()
			}
		});
    }

    keyEvent(event: KeyboardEvent) {
        if (event.key == 'Enter') {
            event.preventDefault()
            this.logic.execute((event.target as HTMLInputElement).value.trim(), true)
            this.input.value = ''
            this.hide()
        } else if (event.key == ';' || event.key == 'Escape') {
            this.hide()
        } else if (event.key == 'Tab') {
            event.preventDefault()
            this.logic.tab()
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
        this.input.focus()
        this.logic.updateAliases(this.logic.getPossibleAliases())
        this.logic.autocomplete('')
    }
}

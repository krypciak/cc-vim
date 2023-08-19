import { InputKey, KeyBinder } from './keybinder.js'
import { VimLogic } from './logic.js'

export default class VimGui {
    dir: string
    keybinder: KeyBinder = new KeyBinder()
    visible: boolean = false
    block!: HTMLElement
    input!: HTMLInputElement
    suggestions!: HTMLElement
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

        this.logic.updateAliases()
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
                            left: 20%;
							width: 60%;
							background: rgba(0, 0, 0, 0.8);
							color: white;
                            font-size: 150%;
							display: block;">
						> <input id="viminput" style="
                            background: rgba(0, 0, 0, 0.8);
                            font-size: 150%;
							width: 98%;
                        ">
                        <div id="suggestions"></div>
					</div>
				`)

				self.block = document.getElementById('vim')!
                const input = self.input = document.getElementById('viminput') as HTMLInputElement
                self.suggestions = document.getElementById('suggestions')!

                input.onkeydown = (e: KeyboardEvent) => { self.logic.keyEvent(e) }
                self.hide()
			}
		});
    }

    hide() {
        this.visible = false
        this.block.style.display = 'none'
        document.getElementById('game')!.focus()
    }

    show() {
        this.visible = true
        this.block.style.display = 'block'
        this.input.focus()
        this.logic.autocomplete()
    }
}

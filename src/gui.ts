import { runTask } from 'cc-instanceinator/src/inst-util'
import { VimLogic } from './logic'
import { MainSuggestionTable } from './mainSuggestionTable'

export class VimGui {
    visible: boolean = false
    block: HTMLElement
    historyBlock: HTMLElement
    input: HTMLInputElement
    historyTable: HTMLTableElement
    suggestionTable: HTMLTableElement
    suggestionArgType: HTMLTableElement
    suggestionArgTable: HTMLTableElement
    logic: VimLogic = VimLogic.new()
    mst!: MainSuggestionTable
    instanceId: number

    constructor() {
        const id = (this.instanceId = window.instanceinator?.id ?? 0)

        document.body.insertAdjacentHTML(
            'beforeend',
            `
                    <div id="vimHistory${id}"
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
                            z-index: 99999;
                        ">
                    <table id="historyTable${id}" style="
                        border-collapse: collapse;
                        z-index: 99999;
                    "></table>
                    </div>
					<div id="vim${id}"
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
                            z-index: 99999;
                        ">
						<input id="viminput${id}" autocomplete="off" style="
                            background: rgba(0, 0, 0, 1);
                            font-size: 150%;
							width: 100%;
                        ">
                        <table id="suggestionTable${id}" style="
                            border-collapse: collapse;
                        "></table>
                        <table id="suggestionArgType${id}" style="
                            border-collapse: collapse;
                            left: 5%;
                        "></table>
                        <table id="suggestionArgTable${id}" style="
                            border-collapse: collapse
                            left: 5%;
                        "></table>
					</div>
				`
        )

        this.historyBlock = document.getElementById(`vimHistory${id}`)!
        this.block = document.getElementById(`vim${id}`)!
        const input = (this.input = document.getElementById(`viminput${id}`) as HTMLInputElement)
        this.historyTable = document.getElementById(`historyTable${id}`) as HTMLTableElement
        this.suggestionTable = document.getElementById(`suggestionTable${id}`) as HTMLTableElement
        this.suggestionArgType = document.getElementById(`suggestionArgType${id}`) as HTMLTableElement
        this.suggestionArgTable = document.getElementById(`suggestionArgTable${id}`) as HTMLTableElement

        input.addEventListener('keydown', (e: KeyboardEvent) => {
            this.keyEvent(e)
        })
        input.addEventListener('input', (e: any) => {
            this.mst.inputEvent(e.target.value, this.input.selectionStart!)
        })
        this.hide()
    }

    keyEvent(event: KeyboardEvent) {
        const target = event.target as HTMLInputElement
        if (event.key == 'Enter') {
            event.preventDefault()
            const cmd = target.value.trim()
            this.mst.enter(cmd)

            const run = () => this.logic.executeFromInput(cmd, this.mst.suggestions[0]?.item, this.mst.currentArgTables?.map(t => t?.suggestions[0]?.item))
            if (window.instanceinator) {
                const inst = instanceinator.instances[this.instanceId]
                if (inst) {
                    runTask(inst, run)
                }
            } else run()

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
        if (!this.mst) {
            this.mst = new MainSuggestionTable(
                this.input,
                this.suggestionTable,
                this.suggestionArgTable,
                this.historyTable,
                this.suggestionArgType,
                this.logic,
                'assets/mod-data/cc-vim/history.json'
            )
        }
        this.mst.values = this.logic.getPossibleAliases()
        this.mst.updateValues()
        this.mst.autocomplete('', 0)
    }
}

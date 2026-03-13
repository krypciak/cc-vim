import { VimGui } from './gui.js'
import { registerOpts } from './options.js'
import { addWidgets } from './widgets.js'

const fs: typeof import('fs') = (0, eval)("require('fs')")

export default class VimPlugin {
    dir: string

    constructor(mod: { baseDirectory: string }) {
        this.dir = mod.baseDirectory
    }

    async prestart() {
        registerOpts()
        this.addInjects()

        if (!fs.existsSync('assets/mod-data')) {
            fs.mkdirSync('assets/mod-data')
        }
        if (!fs.existsSync('assets/mod-data/cc-vim')) {
            fs.mkdirSync('assets/mod-data/cc-vim')
        }

        addWidgets()
    }

    addInjects() {
        ig.Gui.inject({
            init(...args) {
                this.parent(...args)
                ig.vimGui = new VimGui()
            },
        })
    }
}

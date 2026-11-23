import { VimGui } from './gui.js'
import { registerOpts } from './options.js'

const fs: typeof import('fs') = (0, eval)("require('fs')")
async function fileExists(path: string) {
    return !!(await fs.promises.stat(path).catch(_ => false))
}

export default class VimPlugin {
    dir: string

    constructor(mod: { baseDirectory: string }) {
        this.dir = mod.baseDirectory
    }

    prestart() {
        registerOpts()
        this.addInjects()

        void this.mkdirs()
    }

    async mkdirs() {
        if (!(await fileExists('assets/mod-data'))) await fs.promises.mkdir('assets/mod-data')
        if (!(await fileExists('assets/mod-data/cc-vim'))) await fs.promises.mkdir('assets/mod-data/cc-vim')
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

import { VimGui } from './gui'
import { registerOpts } from './options'
import { mkdirRecursive } from 'ccmodmanager/src/fs-util'

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
        await mkdirRecursive('assets/mod-data/cc-vim')
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

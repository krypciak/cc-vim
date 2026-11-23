import type { Mod1 } from 'ccmodmanager/types/types'
import { VimGui } from './gui'
import { setModMetadata } from './mod-metadata'
import { registerOpts } from './options'
import { mkdirRecursive } from 'ccmodmanager/src/fs-util'

export default class VimPlugin {
    constructor(mod: Mod1) {
        setModMetadata(mod)
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

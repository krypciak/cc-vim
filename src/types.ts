import type { VimGui } from './gui'
import type { VimLogic } from './logic'
import type {} from 'cc-instanceinator/src/plugin'

export {}

declare global {
    const vim: VimLogic
    interface Window {
        vim: VimLogic
    }

    namespace ig {
        var vimGui: VimGui
    }
}

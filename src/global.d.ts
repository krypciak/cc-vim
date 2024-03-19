import { VimLogic } from './logic'

export {}

declare global {
    const vim: VimLogic
    interface Window {
        vim: VimLogic
    }
}

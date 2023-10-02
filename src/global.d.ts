import { VimLogic } from "./logic"

export {}

declare global {
    const vim: VimLogic
    export interface Window {
        vim: VimLogic
    }
}

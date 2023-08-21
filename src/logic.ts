import VimGui from './plugin.js'
import { addBaseAliases } from './aliases.js'

export interface Alias {
    origin: string /* namespace */
    name: string   /* command name */
    description: string
    command: ((...args: string[]) => void)  /* command to execute */
    condition: /* if the alias appears in the menu, updated every time the menu is shown */
               'ingame'    /* can only be used in-game */
             | 'global'    /* can be used anywhere */
             | 'titlemenu' /* can only be used in the title menu */
             | ((ingame: boolean) => boolean) /* custom function */

    arguments: AliasArguemnt[] /* see below, argument length is not enforced */
    
    keys: string[]    /* what do include in the fuzzy search */
    display: string[] /* what to display */
}

export interface AliasArguemnt {
    type: string /* value type, doesnt really do anything, not enforced */
    possibleArguments?: /* possible types, not enforced */
                       AliasArguemntEntry[]         /* hard-coded values */
                     | (() => AliasArguemntEntry[]) /* custom function, run every time the possible values list is shown */
    description: string
}

export interface AliasArguemntEntry {
    value: string   /* what will be passed to the function */

    keys: string[]    /* what do include in the fuzzy search */
    display: string[] /* what to display */
}

export interface Command {
    base: string
    args: string[]
}

export class VimLogic {
    static argSplit = ','

    aliasesMap: Map<string, (...args: string[]) => void> = new Map()
    aliases: Alias[] = []

    constructor(public gui: VimGui) {
        Object.assign(window, {vim: this})
        addBaseAliases()
    }

    addAlias(origin: string, name: string, description: string,
        condition: 'ingame' | 'global' | 'titlemenu' | ((ingame: boolean) => boolean),
        command: ((...args: string[]) => void), args: AliasArguemnt[] = []) {

        const alias: Alias = { 
            origin, name, description, condition, command,
            keys: [ origin, name, description ],
            display: [ origin, name, description, command.toString() ],
            arguments: args
        }
        this.aliases.push(alias)
        this.aliasesMap.set(alias.name, alias.command)
    }
    
    getPossibleAliases(): Alias[] {
        const suggestions: Alias[] = []
        this.aliases.forEach(a => suggestions.push(a))
        // @ts-expect-error ig.game.maps not in typedefes
        const ingame: boolean = ig.game.maps.length != 0

        const filtered = suggestions.filter(a => {
            if (typeof a.condition == 'string') {
                switch (a.condition) {
                    case 'global': return true
                    case 'ingame': return ingame
                    case 'titlemenu': return ! ingame
                }
            } else {
                return a.condition(ingame)
            }
        })
        for (let i = 0; i < filtered.length; i++) {
            const alias = filtered[i]
            for (let h = 0; h < alias.arguments.length; h++) {
                const arg: AliasArguemnt = alias.arguments[h]
                if (arg.possibleArguments && typeof arg.possibleArguments === 'function') {
                    alias.arguments[h] = ig.copy(arg)
                    alias.arguments[h].possibleArguments = arg.possibleArguments()
                }
            }
        }
        return filtered
    }

    executeFunc(cmd: ((...args: string[]) => void), args: string[] = []): any | null {
        try {
            cmd(...args)
            return null
        } catch (e) {
            return e
        }
    }

    decomposeCommandString(input: string, ignoreError = false): Command {
        const baseEndIndex = input.indexOf(':')
        let base: string = ''
        let args: string[] = []

        if (baseEndIndex == -1) {
            if (input.trim().split(' ').length == 1) {
                base = input
            } else if (ignoreError) {
                base = ''
            } else {
                throw new Error('cc-vim: invalid command syntax: ' + input)
            }
        } else {
            base = input.substring(0, baseEndIndex)
            args = input.substring(baseEndIndex+1).split(VimLogic.argSplit)
        }
        return { base, args }
    }

    private executeJsString(input: string): boolean {
        // has to start with !
        const execFunction = () => { (0, eval)(input.substring(1)) }
        const result = this.executeFunc(execFunction, [])
        if (result) {
            console.log(result)
            return false
        }
        return true
    }

    executeString(input: string): boolean {
        if (input.startsWith('!')) {
            return this.executeJsString(input)
        }

        let execFunction: ((...args: string[]) => void)
        let args: string[] = []

        const { base, args: args1 } = this.decomposeCommandString(input)
        args = args1
        if (this.aliasesMap.has(base)) {
            execFunction = this.aliasesMap.get(base)!
        } else {
            throw new Error('cc-vim: invalid command syntax: ' + input)
        }

        const result: any | null = this.executeFunc(execFunction, args)
        // if an error accured
        if (result) {
            console.log(result)
            return false
        }

        return true
    }

    executeFromInput(input: string, fallbackSuggestion: Alias, fallbackSuggesionArgs?: AliasArguemntEntry[]) {
        if (input.startsWith('!')) {
            return this.executeJsString(input)
        }
        if (fallbackSuggestion) {
            const { args } = this.decomposeCommandString(input, true)
            if (fallbackSuggesionArgs) {
                for (let i = 0; i < args.length; i++) {
                    if (fallbackSuggesionArgs[i]) {
                        args[i] = fallbackSuggesionArgs[i].value
                    }
                }
            }

            fallbackSuggestion.command(...args)
        }
    }
}

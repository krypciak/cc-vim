import VimGui from './plugin.js'
import { addBaseAliases } from './aliases.js'

export interface AliasArguemntEntry {
    value: string
    other: string[]

    keys: string[]
    display: string[]
}

export interface AliasArguemnt {
    type: string
    // { valie: string; desc: string }[] but in a format that fuse.js can understand
    possibleArguments?: AliasArguemntEntry[] | (() => AliasArguemntEntry[])
    description: string
}

export interface Alias {
    origin: string
    name: string
    desc: string
    command: ((...args: string[]) => void)
    condition: 'ingame' | 'global' | 'titlemenu' | ((ingame: boolean) => boolean)
    arguments: AliasArguemnt[]
    
    keys: string[]
    display: string[]
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

    addAlias(origin: string, name: string, desc: string,
        condition: 'ingame' | 'global' | 'titlemenu' | ((ingame: boolean) => boolean),
        command: ((...args: string[]) => void), args: AliasArguemnt[] = []) {

        const alias: Alias = { 
            origin, name, desc, condition, command,
            keys: [ origin, name, desc ],
            display: [ origin, name, desc, command.toString() ],
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

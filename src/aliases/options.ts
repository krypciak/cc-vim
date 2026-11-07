import type { GuiOption } from 'ccmodmanager/types/mod-options'
import type { AliasArguemntEntry } from '../logic'

export function addOptionsAliases() {
    vim.addAlias(
        'cc-vim',
        'option',
        'Set a global option setting',
        'global',
        (option: string, value: string) => {
            value = value.trim()
            let val: any
            if (value === 'true') {
                val = true
            } else if (value === 'false') {
                val = false
            } else if (!isNaN(parseInt(value))) {
                val = parseInt(value)
            } else {
                val = value
            }
            sc.options.set(option, val)
            ig.storage.saveGlobals()
        },
        [
            {
                type: 'string',
                description: 'value name',
                possibleArguments(): AliasArguemntEntry[] {
                    const arr: AliasArguemntEntry[] = Object.keys(sc.options.values)
                        .filter(str => {
                            const type = sc.OPTIONS_DEFINITION[str].type
                            return type !== 'INFO' && type !== 'CONTROLS'
                        })
                        .map(str => {
                            const entryTxt: undefined | { name: string; description: string } =
                                ig.lang.labels.sc.gui.options[str]

                            const keys: string[] = [str]
                            if (entryTxt?.name) {
                                keys.push(entryTxt.name)
                            }
                            if (entryTxt?.description) {
                                keys.push(entryTxt.description)
                            }

                            return { value: str, keys, display: keys }
                        })
                    return arr
                },
            },
            {
                type: 'string',
                description: 'value',
                possibleArguments(): AliasArguemntEntry[] {
                    return [
                        { value: 'true', keys: ['true'], display: ['true'] },
                        { value: 'false', keys: ['false'], display: ['false'] },
                    ]
                    // const arr: AliasArguemntEntry[] = Object.keys(sc.options.values).filter(str => {
                    //     const type = sc.OPTIONS_DEFINITION[str].type
                    //     return type !== 'INFO' && type !== 'CONTROLS'
                    // }).map(str => {
                    //     const entryTxt: { name: string, description: string, group?: string[] } = ig.lang.labels.sc.gui.options[str]
                    //     const entry: sc.OptionDefinition = sc.OPTIONS_DEFINITION[str]

                    //     let types: [string, any][] = []
                    //     switch (entry.type) {
                    //         case 'LANGUAGE':
                    //         case 'BUTTON_GROUP': {
                    //             const vals = Object.values(entry.data)
                    //             for (let i = 0; i < entryTxt.group!.length; i++) {
                    //                 types.push([entryTxt.group![i], vals[i]])
                    //             }
                    //             break
                    //         }
                    //         case 'OBJECT_SLIDER': {
                    //             types = Object.entries(entry.data).map(e => [e[0], e[1]])
                    //             break
                    //         }
                    //         case 'ARRAY_SLIDER':
                    //             for (let i = entry.data[0]; i < entry.data[1]; i += 0.1) {
                    //                 types.push([i.toString(), i])
                    //             }
                    //             break
                    //         case 'CHECKBOX':
                    //             types = [['true', true], ['false', false]]
                    //             break
                    //     }
                    //     const keys: string[] = types.map(t => t[0])
                    //     return { value: keys[0], keys, display: keys }
                    // })
                    // return arr
                },
            },
        ]
    )

    if (window.modmanager) {
        vim.addAlias(
            'cc-vim',
            'modmanager-option',
            'Set a mod option registered in CCModManager',
            'global',
            (option: string, value: string) => {
                value = value.trim()
                let val: any
                if (value === 'true') {
                    val = true
                } else if (value === 'false') {
                    val = false
                } else if (!isNaN(parseInt(value))) {
                    val = parseInt(value)
                } else {
                    val = value
                }
                const [modId, optName] = option.split('@@@')
                modmanager.options[modId][optName] = value
            },
            [
                {
                    type: 'string',
                    description: 'value name',
                    possibleArguments(): AliasArguemntEntry[] {
                        const aliasArr: AliasArguemntEntry[] = []

                        for (const modId in modmanager.options) {
                            const options = modmanager.options[modId]
                            const flatOpts = options.flatOpts
                            for (const optName in options) {
                                if (optName == 'flatOpts') continue

                                const optConfig: GuiOption = flatOpts[optName]
                                if (optConfig.type == 'CONTROLS') continue

                                const keys: string[] = [
                                    modId,
                                    optName,
                                    optConfig.name,
                                    optConfig.description,
                                    optConfig.type,
                                ]

                                aliasArr.push({ value: `${modId}@@@${optName}`, keys, display: keys })
                            }
                        }

                        return aliasArr
                    },
                },
                {
                    type: 'string',
                    description: 'value',
                    possibleArguments(): AliasArguemntEntry[] {
                        return [
                            { value: 'true', keys: ['true'], display: ['true'] },
                            { value: 'false', keys: ['false'], display: ['false'] },
                        ]
                    },
                },
            ]
        )
    }
}

import type { Options } from 'ccmodmanager/types/mod-options'

export let Opts: ReturnType<typeof sc.modMenu.registerAndGetModOptions<ReturnType<typeof registerOpts>>>

export function registerOpts() {
    const opts = {
        general: {
            settings: {
                title: 'General',
                tabIcon: 'general',
            },
            headers: {
                general: {
                    openMenuKey: {
                        type: 'CONTROLS',
                        init: { key1: ig.KEY.SEMICOLON },
                        pressEvent() {
                            vim.gui.show()
                        },
                        global: true,

                        name: 'Open vim command propmt',
                        description: 'Opens the vim command propmt',
                    },
                },
            },
        },
    } as const satisfies Options

    Opts = sc.modMenu.registerAndGetModOptions(
        {
            modId: 'cc-vim',
            title: 'cc-vim',
        },
        opts
    )
    return opts
}

import type {} from 'nax-ccuilib/src/ui/quick-menu/quick-menu-extension'

export function addWidgets() {
    const ccuilib = window.nax?.ccuilib
    /* optional dependency on https://github.com/conorlawton/nax-ccuilib */
    if (ccuilib?.QuickRingMenuWidgets) {
        ccuilib.QuickRingMenuWidgets.addWidget({
            name: 'dev_reload',
            title: 'Game reload',
            description: 'Reload the game',
            pressEvent: () => window.vim.executeString('reload'),
            image: () => ({
                gfx: new ig.Image('media/gui/menu.png'),
                srcPos: { x: 449, y: 464 },
                pos: { x: 9, y: 8 },
                size: { x: 16, y: 16 },
            }),
        })
        ccuilib.QuickRingMenuWidgets.addWidget({
            name: 'dev_mapReload',
            title: 'Map reload',
            description: 'Reload the map',
            pressEvent: () => window.vim.executeString('reload-level'),
            image: () => ({
                gfx: new ig.Image('media/gui/menu.png'),
                srcPos: { x: 433, y: 464 },
                pos: { x: 9, y: 8 },
                size: { x: 16, y: 16 },
            }),
        })
    }
}

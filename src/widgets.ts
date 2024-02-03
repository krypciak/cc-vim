export function addWidgets() {
    /* optional dependency on https://github.com/krypciak/cc-diorbital-menu */
    if (sc.QuickRingMenuWidgets) {
        sc.QuickRingMenuWidgets.addWidget({
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
        sc.QuickRingMenuWidgets.addWidget({
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

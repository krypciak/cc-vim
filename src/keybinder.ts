export class InputKey {
    private id: string

    constructor(
        public key: ig.KEY,
        public name: string,
        public description: string,
        public category: sc.OPTION_CATEGORY,
        public hasDivider: boolean,
        public header: string,
        public onPress: () => void,
        public parent: any,
        public global: boolean) {

        this.id = 'keys-' + name
    }

    private checkForKeyPress() {
        if (ig.input.pressed(this.name)) {
            this.onPress.bind(this.parent)()
        }
    }

    bind() {
        const key = this
        sc.OPTIONS_DEFINITION[key.id] = {
            type: 'CONTROLS',
            init: { key1: key.key },
            cat: key.category,
            hasDivider: key.hasDivider,
            header: key.header,
        }

        if (! key.global) {
            ig.ENTITY.Player.inject({
                update(...args) {
                    key.checkForKeyPress()
                    return this.parent(...args)
                }
            })
        }
    }
    updateLabel() {
        if (this.global) {
            ig.game.addons.preUpdate.push(this);
        }
        ig.lang.labels.sc.gui.options.controls.keys[this.name] = this.description
    }

    onPreUpdate() {
        this.checkForKeyPress()
    }
}

export class KeyBinder {
    private keys: InputKey[] = []

    addKey(key: InputKey) {
        this.keys.push(key)
    }

    bind() {
        for (const key of this.keys) {
            key.bind()
        }
    }

    updateLabels() {
        for (const key of this.keys) {
            key.updateLabel()
        }
    }

    addHeader(name: string, displayName: string) {
        ig.lang.labels.sc.gui.options.headers[name] = displayName
    }
}

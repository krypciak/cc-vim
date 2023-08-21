[![](https://tokei.rs/b1/github/krypciak/cc-vim?type=typescript&label=TypeScript&style=flat)](https://github.com/krypciak/cc-vim)

## Dependencies
1. [input-api](https://github.com/CCDirectLink/input-api)  

![Realeses](https://github.com/CCDirectLink/organization/blob/master/assets/badges/releases%402x.png)  


# For Developers
- [Types](#types)  
- [Examples](#examples)
  	- [Simplest](#simplest-alias)
	- [With arguments](#examples-with-arguments)  
- [TypeScript support](#typescript-support)  
- [JavaScript support](#javascript-support)  
- [Contribution](#contribution)  
- [Building](#building)  

Include the mod as a hard dependency in `ccmod.json` or use:
```ts
if (vim) {
	... your aliases ...
}
```
## Types
```ts
interface Alias {
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
interface AliasArguemnt {
    type: string /* value type, doesnt really do anything, not enforced */
    possibleArguments?: /* possible types, not enforced */
                       AliasArguemntEntry[]         /* hard-coded values */
                     | (() => AliasArguemntEntry[]) /* custom function, run every time the possible values list is shown */
    description: string
}
interface AliasArguemntEntry {
    value: string   /* what will be passed to the function */

    keys: string[]    /* what do include in the fuzzy search */
    display: string[] /* what to display */
}

```

## Examples
### Simplest alias:  
```ts
//           namespace  command-name  description       condition function
vim.addAlias('cc-vim', 'reload',      'Reload the game, 'global', () => { window.location.reload() })
```
### Examples with arguments:
```ts
vim.addAlias('cc-vim', 'player-move', 'Move player', 'ingame', (x?: string, y?: string, z?: string) => {
    const pos: Vec3 = ig.game.playerEntity.coll.pos
	ig.game.playerEntity.setPos(pos.x + parseInt(x ?? '0'), pos.y + parseInt(y ?? '0'), pos.z + parseInt(z ?? '0'))
}, [
	{ type: 'number', description: 'x to add' },
	{ type: 'number', description: 'y to add' },
	{ type: 'number', description: 'z to add' },
])
```
```ts
vim.addAlias('cc-vim', 'load-preset', 'Load save preset', 'global', (presetId: string) => {
    const id = parseInt(presetId.trim())
    console.log('presetId:', id)
}, [{
        type: 'number',
        possibleArguments(): AliasArguemntEntry[] {
            const arr: AliasArguemntEntry[] = []
            for (const i of Object.keys(sc.savePreset.slots)) {
		const slot: sc.SavePresetData = sc.savePreset.slots[parseInt(i)]
                const value = i.toString()
                const keys = [ value, slot.title.value, slot.sub.value, slot.path ]
                arr.push({ value, keys, display: keys})
            }
            return arr
        },
        description: 'Preset to load'
}])
```

## TypeScript support
```bash
npm install --save-dev github:krypciak/cc-vim
```
```ts
import { VimLogic, AliasArguemntEntry } from '../node_modules/cc-vim/src/logic.js'
```
## JavaScript support
you dummy learn typescript  
the same as typescript just remove the types (thingis behind `:`)

## Contribution
Feel free to pr any aliases you would like to see added  

## Building
```bash
git clone https://github.com/krypciak/cc-vim
cd cc-vim
npm install
npm run start
# this should return no errors or very few
npx tsc
```

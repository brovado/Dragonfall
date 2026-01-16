# Dragonfall (Fresh Drop v0.4.1)

GitHub Pages–friendly (no build step).

- `index.html` loads React UMD + Tailwind CDN
- `src/df/namespace.js` creates global `DF`
- `src/df/boot.js` sequentially loads files and finally `src/main.js`

## Phaser hybrid viewport

Phaser is loaded via CDN in `index.html` and bootstrapped as a hybrid viewport layer inside the existing React UI shell. The core wiring lives in:

- `src/df/phaser/bridge/dfBridge.js` — lightweight bridge with `getState()`, `dispatch(action)`, `subscribe(fn)`
- `src/df/phaser/PhaserViewport.js` — React component that mounts a Phaser.Game instance
- `src/df/phaser/scenes/BootScene.js` + `src/df/phaser/scenes/CombatRoomScene.js` — minimal combat sandbox

To extend next: add class kits/abilities in Phaser scenes, sync richer state through the bridge, and swap the combat room layout for generated rooms tied to run progression.

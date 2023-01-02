# AMMiSTer

![screenshot-plan](https://github.com/city41/AMMiSTer/blob/main/screenshot-plan.png?raw=true)

![screenshot-detail](https://github.com/city41/AMMiSTer/blob/main/screenshot-detail.png?raw=true)

![screenshot-newlyUpdated](https://github.com/city41/AMMiSTer/blob/main/screenshot-newlyUpdated.png?raw=true)

![screenshot-exportToMister](https://github.com/city41/AMMiSTer/blob/main/screenshot-exportToMister.png?raw=true)

![screenshot-exportToDirectory](https://github.com/city41/AMMiSTer/blob/main/screenshot-exportToDirectory.png?raw=true)

An app for managing arcade cores. Download all of the arcade cores and their ROMs to your PC. Then decide what games will go onto your MiSTer, organized anyway you like.

Slated features for the first alpha version:

- Decide which games go onto your MiSTer(s) and organize them anyway you like.
- Check for updated/new cores and corresponding MAME ROMs
- Export your decided game structure into a local directory on your computer or directly onto a MiSTer

Planned upcoming features:

- Install cores not yet in a distribution. Good for trying out beta cores. When they get into a distribution, automatically upgrade to the official release.
- More metadata for games, maybe links to YouTube long play videos to help decide if a game is worth of adding

**Built with:** TypeScript, React, Tailwind, Electron  
**Target platforms:** Linux, MacOS, Windows  
**Status:** getting close to first alpha version

## Development

```bash
# install app dependencies
yarn
# start a dev webpack server
yarn dev
# then in a separate terminal, launch Electron
yarn start
```

Changes you make automatically cause Webpack to rebuild, then refresh Electron to see your change. If your changes are on the main process side, kill the app and restart it.

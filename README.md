# AMMiSTer

An app for managing arcade games on the MiSTer. Download all of the arcade cores and their ROMs to your PC. Then decide what games will go onto your MiSTer, organized anyway you like. When new updates come out, you can grab those updates, and just update the games that are on your MiSTer.

![screenshot](https://github.com/city41/AMMiSTer/blob/main/screenshot.png?raw=true)

![screenshot-detail](https://github.com/city41/AMMiSTer/blob/main/screenshot-detail.png?raw=true)

![screenshot-newlyUpdated](https://github.com/city41/AMMiSTer/blob/main/screenshot-newlyUpdated.png?raw=true)

![screenshot-exportToMister](https://github.com/city41/AMMiSTer/blob/main/screenshot-exportToMister.png?raw=true)

![screenshot-exportToDirectory](https://github.com/city41/AMMiSTer/blob/main/screenshot-exportToDirectory.png?raw=true)

Features:

- Decide which games go onto your MiSTer(s) and organize them anyway you like.
- Bulk add games by using criteria such as manufacturer, year released, etc
- Check for updated/new cores and corresponding MAME ROMs
- Export your decided game structure into a local directory on your computer or directly onto a MiSTer

Planned upcoming features:

- Favoriting games
- Install cores not yet in a distribution. Good for trying out beta cores. When they get into a distribution, automatically upgrade to the official release.
- More metadata for games, maybe links to YouTube long play videos to help decide if a game is worth of adding
- Notes on games. Helps you rememember why a certain game is not in your plan

**Built with:** TypeScript, React, Tailwind, Electron  
**Target platforms:** Linux, MacOS, Windows  
**Status:** getting close to first beta version, check the [release notes](https://github.com/city41/AMMiSTer/blob/main/RELEASE_NOTES.md)

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

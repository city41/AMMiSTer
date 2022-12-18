# AMMiSTer

Arcade Manager for MiSTer. An app for managing arcade cores. Slated features:

- Decide which games go onto your MiSTer and organize them anyway you like.
- Check for updated/new cores and corresponding MAME ROMs
- Install cores not yet in a distribution. Good for trying out beta cores. When they get into a distribution, automatically upgrade to the official release.

**Built with:** React, Tailwind, Electron  
**Target platforms:** Linux, MacOS, Windows  
**Status:** juuuuuuust started

## Development

```bash
# install app dependencies
yarn
# start a dev webpack server
yarn dev
# then in a separate terminal, launch Electron
yarn start
```

Changes you make automatically cause Webpack to rebuild, then refresh Electron to see your change.

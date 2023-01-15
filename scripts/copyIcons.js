// This is a simple way to accomplish copying across windows, linux and macos

const fs = require('node:fs');

const icon640 = fs.readFileSync('./resources/icon-640x640.png');
fs.writeFileSync('./dist/icon.png', icon640);

const icns = fs.readFileSync('./resources/icon-512x512.icns');
fs.writeFileSync('./dist/icon.icns', icns);

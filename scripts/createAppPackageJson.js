#! /usr/bin/env node
const fs = require('node:fs');

const devPackageJson = require('../package.json');
delete devPackageJson.build;

const asString = JSON.stringify(devPackageJson, null, 2);
fs.writeFileSync('./dist/package.json', asString);

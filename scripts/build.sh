#!/bin/bash

# clean out dist folder
rm -rf ./dist
mkdir ./dist

# build main.js
tsc -noEmit -skipLibCheck && node esbuild.config.mjs production

# compile scss into css
npx sass ./styles/global.scss ./dist/styles.css --no-source-map

# make a copy of manifest.json
cp ./manifest.json ./dist/manifest.json

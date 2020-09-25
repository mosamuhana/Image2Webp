# Converts images in a folder to .webp images

Converts JPEG, PNG, WebP, GIF, SVG, TIFF images to .webp format.

## Setup

1. `npm install`
2. `npm run build`

## Run

1.  Place images you wish to convert in the `source` folder (JPEG, PNG, WebP, GIF, SVG, TIFF)
2.  `node convert.js -s "<source_dir>" -o "<dest_dir>"`
3.  Your converted files will be in the `<dest_dir>` folder

## options
- run `node convert.js --help`

## Convert to exe for windows

You can package the project code to exe by using [pkg](https://www.npmjs.com/package/pkg)
- `npm i -g pkg`
- `npm run build`
- `pkg -t latest-win-x64 convert.js -o convert.exe`

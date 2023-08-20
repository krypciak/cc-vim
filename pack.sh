#!/bin/sh
BASE_NAME='cc-vim'
NAME="${BASE_NAME}-$(jq '.version' ccmod.json | sed 's/^"//;s/"$//').ccmod"
rm -rf "$BASE_NAME"*
esbuild --target=es2018 --format=esm --platform=node --bundle --outfile='plugin.js' 'src/plugin.ts'
zip -r "$NAME" ./ -x "*.zip" "node_modules/*" ".git*" "*.ts" "README.md" "package.json" "tsconfig.json" "pack.sh" "package-lock.json"

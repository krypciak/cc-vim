#!/bin/sh
BASE_NAME="$(jq '.id' ccmod.json | sed 's/^"//;s/"$//')"
NAME="${BASE_NAME}-$(jq '.version' ccmod.json | sed 's/^"//;s/"$//').ccmod"
rm -rf "$BASE_NAME"*
npm install
npm run build
mkdir -p pack
cp -r icon LICENSE plugin.js ./pack
cd ./pack
for file in $(find . -iname '*.json'); do
    jq '.' ../$file -c > $file
done
cp ../ccmod.json .
rm -rf icon/icon.kra icon/icon.png~
zip -r "../$NAME" .
cd ..
rm -rf pack

#!/bin/sh

cd "$(dirname "$0")"

for i in *.json; do
    json-align -i "$i"
done

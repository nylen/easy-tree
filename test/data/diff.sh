#!/bin/sh

fn="$1"
ext="$2"

if [ -z "$ext" ]; then
    "$0" "$fn" txt
    "$0" "$fn" json
    exit
fi

cd "$(dirname "$0")"

GIT_DIR= git diff -b template-full.$ext "$fn.$ext"
exit 0

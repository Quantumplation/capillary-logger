#!/bin/sh

if [ -d .git/hooks ]; then
  cp -fp .githooks/* .git/hooks/. 
  echo 'Copied git hooks'
fi
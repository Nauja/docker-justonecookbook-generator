#!/bin/sh -e

cd /home/service
rm -rf node_modules
npm install express
npm install

exec "node app.js"

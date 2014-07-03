#!/bin/bash

DEBUG="js-schema.debug.js"
MIN="js-schema.min.js"

browserify index.js -o $DEBUG -s schema

uglifyjs $DEBUG >$MIN

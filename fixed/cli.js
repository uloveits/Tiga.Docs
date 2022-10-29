#!/usr/bin/env node

const rcfile = require("rcfile");

const config = rcfile("topdf");

require("../src/index.js")(config);

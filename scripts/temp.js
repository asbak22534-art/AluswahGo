const fs = require('fs');
const http = require('https');

// A simple script to copy the 720x720 as generic icons. The problem is Chrome enforces the dimensions to match the declared size if possible, but actually if we just declare them and provide the exact image, it's better to really resize them.
// Let's use Jimp.

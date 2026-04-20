const fs = require('fs');
const https = require('https');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

console.log('Downloading valid PNG...');
download('https://ui-avatars.com/api/?name=Al+Uswah&background=0d9488&color=fff&size=512&bold=true&font-size=0.33', 'public/logo.png')
  .then(() => {
    console.log('Successfully downloaded valid logo.png');
  })
  .catch(console.error);

var sharp = require('sharp');

var targetPixelArea = 500000;

var original = sharp(process.argv[2])
  .limitInputPixels(Math.pow(2, 31) - 1);
original
  .metadata()
  .then(function (metadata) {
    console.log(metadata);
    var pixelArea = metadata.width * metadata.height;
    var ratio = Math.sqrt(targetPixelArea / pixelArea);
    console.log(pixelArea, original.options.limitInputPixels);
    return original
    .resize(Math.round(ratio * metadata.width))
    .toFile('/tmp/thumb.png');
  })
  .then(function () {
    console.log('Finished generating thumbnail');
  })
  .catch(console.error.bind(console));


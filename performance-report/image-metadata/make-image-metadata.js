var fs = require('fs');
var rimraf = require('rimraf');
var uuid = require('node-uuid');

// Total number of image metadata .json files to create.
var desired = 2000;
var infoFile = 'oam-test-data.json';
var outDir = 'image-info/';
var total = 0;
var fakeData = [];

var moves = [ 
  "up", "down", "right", "left",
  "upperright", "lowerright", "lowerleft", "upperleft" 
];
var moveOps = {
  "up": [0, 1], 
  "down": [0, -1], 
  "right": [1, 0], 
  "left": [-1, 0],
  "upperright": [1, 1], 
  "lowerright": [1, -1], 
  "lowerleft": [-1, -1], 
  "upperleft": [-1, 1]
};

// Remove output directory.
rimraf(outDir, function(err) {
  if ( err ) {
    console.log("rimraf error", err);
    return;
  } 
  fs.mkdir(outDir, function(err) {
    readImageMetadata();
  });
});

function readImageMetadata() {
  fs.readFile(infoFile, 'utf8', function(err, data) {
    var info = JSON.parse(data);
    console.log("results?", info.results.length);
    processImageMetadata(info);
  });
}

function processImageMetadata(info) {
  var count = info.results.length;
  while ( total < desired ) {
    for ( var i = 0; i < info.results.length; i++ ) {
      var fake = makeFake(info.results[i]);
      fakeData.push(fake);
      total++;
      if ( total === desired ) {
        break;
      }
      // Simple progess indicator.
      if ( total % 100 === 0 ) {
        console.log("progress...", total);
      }
    }
  }
  console.log("done creating data", fakeData.length);
  writeImageMetadata(fakeData);
}

function writeImageMetadata(data) {
  data.forEach(function(info) {
    var outFile = outDir + info._id + '.json';
    fs.writeFile(outFile, JSON.stringify(info), function(err, data) {
      if ( err ) {
        console.log("error writing", outFile, total);
      } 
    });
  });
}

// Make a copy of an item, tweak it and send back the copy.
function makeFake(item) {
  // How far to move the bbox.
  var factor = Math.random() * (item.geojson.bbox[2] - item.geojson.bbox[0]);
  // Pick a direction.
  var index = ~~(Math.random() * (moves.length));
  var whichWay = moves[index];
  var move = moveOps[whichWay];
  // Shift the bbox.
  var next = moveCoordinates(item.geojson, factor, move);
  // Stringify to copy and make doing coordinate updates easy.
  var fake = JSON.stringify(item);
  // Update coordinates throughout the item info.
  // http://stackoverflow.com/a/1145525/1934
  item.geojson.bbox.forEach(function(coordinate, index) {
    fake = fake.split(coordinate).join(next[index]);
  });
  fake = JSON.parse(fake);
  // Generate a new id for the metadata.
  fake._id = uuid.v4();
  return fake;
}

// Returns an array (bbox) of coordinates shifted in one of eight directions.
function moveCoordinates(geojson, factor, op) {
  var bbox = geojson.bbox.slice();
  var x = factor * op[0];
  var y = factor * op[1];
  bbox = [ bbox[0] + x, bbox[1] + y, bbox[2] + x, bbox[3] + y];
  return bbox;
}

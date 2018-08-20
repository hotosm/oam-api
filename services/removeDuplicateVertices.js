function removeDuplicate (point, coordinates, index) {
  let duplicate = false;
  let duplicateIndex = null;
  const lastIndex = coordinates.length - 1;
  coordinates.forEach((el, coordIndex) => {
    if (point[0] === el[0] && point[1] === el[1] && index !== coordIndex &&
        coordIndex < lastIndex && coordIndex !== 0) {
      duplicate = true;
      duplicateIndex = coordIndex;
    }
  });
  if (duplicate) {
    coordinates.splice(duplicateIndex, 1);
  }
  return coordinates;
}

function processFeature (feature) {
  if (feature.geometry.type === 'Polygon') {
    feature.geometry.coordinates[0].forEach((coordinates) => {
      coordinates.forEach((point, index) => {
        feature.geometry.coordinates[0] =
          removeDuplicate(point, coordinates, index);
      });
    });
  } else if (feature.geometry.type === 'MultiPolygon') {
    feature.geometry.coordinates.forEach((points, ringIndex) => {
      points.forEach((coordinates, pointIndex) => {
        coordinates.forEach((point, coordIndex) => {
          feature.geometry.coordinates[ringIndex][pointIndex] =
            removeDuplicate(point, coordinates, coordIndex);
        });
      });
    });
  }
  return feature;
}

// Mutates geoJSON argument
module.exports = function (geojson) {
  if (geojson.features) {
    geojson.features.forEach((feature, featureIndex) => {
      geojson.features[featureIndex] = processFeature(feature);
    });
  } else {
    processFeature(geojson);
  }
};

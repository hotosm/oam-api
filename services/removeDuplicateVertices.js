const meta = require('@turf/meta');

function findBadRing (geoJSON, verticeIndexes) {
  const coords = geoJSON.coordinates;
  const rings = meta.lineReduce(geoJSON,
    function (accumulator, cl, featureIndex, multiFeatureIndex, geometryIndex) {
      accumulator.push([multiFeatureIndex, featureIndex]);
      return accumulator;
    }, []);

  const badRing = rings.reduce((accumulator, ring) => {
    const firstIndex = coords[ring[0]][ring[1]][verticeIndexes[0]];
    let ringHasAllDuplicateVertices = true;
    if (firstIndex) {
      for (let index = 1; index < verticeIndexes.length; index++) {
        if (coords[ring[0]][ring[1]][verticeIndexes[index]][0] === firstIndex[0] &&
            coords[ring[0]][ring[1]][verticeIndexes[index]][1] === firstIndex[1]) {
        } else {
          ringHasAllDuplicateVertices = false;
        }
      }
    } else {
      ringHasAllDuplicateVertices = false;
    }
    if (ringHasAllDuplicateVertices) {
      accumulator[0] = ring[0];
      accumulator[1] = ring[1];
    }
    return accumulator;
  }, []);

  return badRing;
}

// Mutates geoJSON argument
module.exports = function (geoJSON, verticeIndexes) {
  const badRingIndex = findBadRing(geoJSON, verticeIndexes);
  if (badRingIndex.length === 2) {
    const badRing = geoJSON.coordinates[badRingIndex[0]][badRingIndex[1]];
    for (let index = 1; index < verticeIndexes.length; index++) {
      badRing.splice(verticeIndexes[index], 1);
    }
  }
};


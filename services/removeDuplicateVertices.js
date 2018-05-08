const meta = require('@turf/meta');

function findBadRing (geoJSON, vertexIndices) {
  const coords = geoJSON.coordinates;
  // Create array of ring indexes with [polygonIndex, ringIndex]
  const rings = meta.lineReduce(geoJSON,
    function (accumulator, cl, fi, multiFeatureIndex, geometryIndex) {
      accumulator.push([multiFeatureIndex, geometryIndex]);
      return accumulator;
    }, []);

  const badRing = rings.reduce((accumulator, ring) => {
    // Check if ring contains duplicate vertex in the first position.
    const firstIndex = coords[ring[0]][ring[1]][vertexIndices[0]];
    let ringHasAllDuplicateVertices = true;
    // Check if ring contains duplicate vertices in the other specified positions.
    if (firstIndex) {
      for (let index = 1; index < vertexIndices.length; index++) {
        if (coords[ring[0]][ring[1]][vertexIndices[index]] != null && coords[ring[0]][ring[1]][vertexIndices[index]][0] === firstIndex[0] &&
            coords[ring[0]][ring[1]][vertexIndices[index]][1] === firstIndex[1]) {
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
module.exports = function (geoJSON, vertexIndices) {
  const badRingIndex = findBadRing(geoJSON, vertexIndices);
  if (badRingIndex.length === 2) {
    // Remove duplicate coordinates from the problem ring.
    const badRing = geoJSON.coordinates[badRingIndex[0]][badRingIndex[1]];
    for (let index = 1; index < vertexIndices.length; index++) {
      badRing.splice(vertexIndices[index], 1);
    }
  }
};


const chai = require('chai');
var getGeom = require('@turf/invariant').getGeom;
const removeDuplicateVertices = require('../../services/removeDuplicateVertices');
const geojson = require('../fixtures/geojson.json');
const expect = chai.expect;

describe('removeDuplicateVertices', () => {
  it('Removes a duplicate vertice', () => {
    const geom = getGeom(geojson);
    expect(geom.coordinates[1][0].length).to.equal(166);
    removeDuplicateVertices(geojson);
    expect(geom.coordinates[1][0].length).to.equal(165);
    removeDuplicateVertices(geojson);
    expect(geom.coordinates[1][0].length).to.equal(165);
  });
});

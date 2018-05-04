const chai = require('chai');
var getGeom = require('@turf/invariant').getGeom;
const removeDuplicateVertices = require('../../services/removeDuplicateVertices');
const expect = chai.expect;

describe('removeDuplicateVertices', () => {
  it('Removes a duplicate vertice', () => {
    const geom = getGeom(require('../fixtures/geojson.json'));
    expect(geom.coordinates[1][0].length).to.equal(166);
    removeDuplicateVertices(geom, [128, 136]);
    expect(geom.coordinates[1][0].length).to.equal(165);
    removeDuplicateVertices(geom, [128, 136]);
    expect(geom.coordinates[1][0].length).to.equal(165);
  });

  it('doesn\'t choke on real world input', () => {
    const geom = getGeom(require('../fixtures/5aebf2ee8153990013b938ef.json'));
    removeDuplicateVertices(geom, [2, 6]);
  });
});

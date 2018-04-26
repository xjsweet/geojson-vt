
import clip from './clip';
import createFeature from './feature';

export default function wrap(features, options) {
    var buffer = options.buffer / options.extent;
    var dimensions = options.dimensions;

    var merged = features;
    var left  = clip(dimensions, features, 1, -1 - buffer, buffer,     0, -1, 2, options); // left world copy
    var right = clip(dimensions, features, 1,  1 - buffer, 2 + buffer, 0, -1, 2, options); // right world copy

    if (left || right) {
        merged = clip(dimensions, features, 1, -buffer, 1 + buffer, 0, -1, 2, options) || []; // center world copy

        if (left) merged = shiftFeatureCoords(dimensions, left, 1).concat(merged); // merge left into center
        if (right) merged = merged.concat(shiftFeatureCoords(dimensions, right, -1)); // merge right into center
    }

    return merged;
}

function shiftFeatureCoords(features, offset) {
    var newFeatures = [];

    for (var i = 0; i < features.length; i++) {
        var feature = features[i],
            type = feature.type;

        var newGeometry;

        if (type === 'Point' || type === 'MultiPoint' || type === 'LineString') {
            newGeometry = shiftCoords(feature.geometry, offset);

        } else if (type === 'MultiLineString' || type === 'Polygon') {
            newGeometry = [];
            for (var j = 0; j < feature.geometry.length; j++) {
                newGeometry.push(shiftCoords(feature.geometry[j], offset));
            }
        } else if (type === 'MultiPolygon') {
            newGeometry = [];
            for (j = 0; j < feature.geometry.length; j++) {
                var newPolygon = [];
                for (var k = 0; k < feature.geometry[j].length; k++) {
                    newPolygon.push(shiftCoords(feature.geometry[j][k], offset));
                }
                newGeometry.push(newPolygon);
            }
        }

        newFeatures.push(createFeature(feature.id, type, newGeometry, feature.tags));
    }

    return newFeatures;
}

function shiftCoords(dimensions, points, offset) {
    var stride = dimensions + 1;
    var newPoints = [];
    newPoints.size = points.size;

    if (points.start !== undefined) {
        newPoints.start = points.start;
        newPoints.end = points.end;
    }

    for (var i = 0; i < points.length; i += stride) {
        if (dimensions === 2) {
            newPoints.push(points[i] + offset, points[i + 1], points[i + 2]);
        } else {
            newPoints.push(points[i] + offset, points[i + 1], points[i + 2], points[i + 3]);
        }
    }
    return newPoints;
}

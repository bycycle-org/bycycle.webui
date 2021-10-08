import { extend as extendExtent } from 'ol/extent';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import { fetchWrapper } from '../fetch';
import { breakpointSwitch } from '../util';
import { ROUTE_STYLE } from '../map/styles';
import { displayLatLong } from '../map/util';

export async function getDirections(state, map, myLocation) {
    let { fromTerm, fromPoint, toTerm, toPoint } = state;

    if (!(fromTerm.trim() && toTerm.trim())) {
        return {};
    }

    const fromMyLocation = fromTerm.toLowerCase() === 'my location';
    const toMyLocation = toTerm.toLowerCase() === 'my location';

    if (fromMyLocation || toMyLocation) {
        const { position } = myLocation;
        if (position) {
            if (fromMyLocation) {
                fromTerm = displayLatLong(position, ',');
                fromPoint = null;
            }
            if (toMyLocation) {
                toTerm = displayLatLong(position, ',');
                toPoint = null;
            }
        } else {
            return { fromTerm, fromPoint, toTerm, toPoint, error: myLocation.error };
        }
    }

    map.clearOverlays();
    map.vectorLayer.getSource().clear(true);

    const params = {
        from: fromTerm,
        to: toTerm,
        from_point: undefined,
        to_point: undefined,
    };

    if (fromPoint) {
        if (typeof fromPoint !== 'string') {
            fromPoint = displayLatLong(fromPoint, ',');
        }
        params.from_point = fromPoint;
    }

    if (toPoint) {
        if (typeof toPoint !== 'string') {
            toPoint = displayLatLong(toPoint, ',');
        }
        params.to_point = toPoint;
    }

    const data = await fetchWrapper('/directions', params);

    if (data === null) {
        // Request aborted
        return null;
    } else if (data.error) {
        return { fromTerm, fromPoint, toTerm, toPoint, error: data.error };
    }

    await updateMap(map, data.results);

    return {
        fromTerm: data.start.name,
        fromPoint: data.start.point.coordinates,
        toTerm: data.end.name,
        toPoint: data.end.point.coordinates,
        results: data.results
    };
}

export async function updateMap (map, results) {
    const start = results[0].start;
    const end = results[results.length - 1].end;

    const coordinates = results.reduce((accumulator, result) => {
        return accumulator.concat(result.linestring.coordinates);
    }, []);
    const line = new Feature({
        geometry: new LineString(coordinates)
    });
    line.setStyle(ROUTE_STYLE);

    const bounds = results.reduce((accumulator, result) => {
        return extendExtent(accumulator, result.bounds);
    }, results[0].bounds);

    map.addOverlay(start.point.coordinates, 'map-marker-start', 'center-center');
    map.addOverlay(end.point.coordinates, 'map-marker-end', 'center-center');
    map.vectorLayer.getSource().addFeature(line);
    map.vectorLayer.setVisible(true);

    await map.fitExtent(bounds, {
        padding: breakpointSwitch(breakpoint => {
            const buttonWidth = 40;
            const formHeight = 120;
            const halfMarkerWidth = 12;
            const panelWidth = 400;
            switch (breakpoint) {
                case 'xs':
                    return [
                        formHeight + halfMarkerWidth + 8,
                        buttonWidth + halfMarkerWidth + 8,
                        halfMarkerWidth + 4,
                        halfMarkerWidth + 4
                    ];
                case 'sm':
                    return [
                        formHeight + halfMarkerWidth + 16,
                        buttonWidth + halfMarkerWidth + 16,
                        halfMarkerWidth + 8,
                        halfMarkerWidth + 8
                    ];
                default:
                    return [
                        formHeight + halfMarkerWidth + 16,
                        buttonWidth + halfMarkerWidth + 16,
                        halfMarkerWidth + 8,
                        panelWidth + halfMarkerWidth + 16
                    ];
            }
        })
    });
}

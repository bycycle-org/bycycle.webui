import { extend as extendExtent } from 'ol/extent';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import { ROUTE_STYLE } from '../map/styles';
import { displayLatLong } from '../map/util';
import { fetchWrapper } from '../util';
import {
    directionsFromTerm,
    directionsFromPoint,
    directionsToTerm,
    directionsToPoint,
    directionsResults,
    directionsError,
    setDirectionsState
} from './stores';

export async function getDirections({ fromTerm, fromPoint, toTerm, toPoint, myLocation }, map) {
    if (!(fromTerm.trim() && toTerm.trim())) {
        return;
    }

    const fromMyLocation = fromTerm.toLowerCase() === 'my location';
    const toMyLocation = toTerm.toLowerCase() === 'my location';

    if (fromMyLocation || toMyLocation) {
        const { position } = myLocation;
        if (position) {
            const latLong = displayLatLong(position);
            if (fromMyLocation) {
                fromTerm = latLong;
                fromPoint = position;
                directionsFromPoint.set(fromPoint);
            }
            if (toMyLocation) {
                toTerm = latLong;
                toPoint = position;
                directionsToPoint.set(toPoint);
            }
        } else {
            directionsError.set({
                error: {
                    title: 'Location Unavailable',
                    explanation: 'Your location is currently unavailable',
                    detail: 'You may need to enable location services in your browser'
                }
            });
            return;
        }
    }

    map.clearOverlays();
    map.vectorLayer.getSource().clear(true);

    const params = {
        from: fromTerm,
        to: toTerm
    };

    if (fromPoint) {
        params.from_point = displayLatLong(fromPoint, ',');
    }

    if (toPoint) {
        params.to_point = displayLatLong(toPoint, ',');
    }

    const data = await fetchWrapper('/directions', params);

    if (data === null) {
        return null;
    } else if (data.error && !data.results) {
        setDirectionsState({ fromTerm, fromPoint, toTerm, toPoint, error: data.error });
        return null;
    }

    const results = data.results;
    const result = results[0];
    const bounds = result.bounds;

    const line = new Feature({
        geometry: new LineString(result.linestring.coordinates),
        name: result.name
    });

    line.setStyle(ROUTE_STYLE);

    if (results.length > 1) {
        results.slice(1).forEach(result => extendExtent(bounds, result.bounds));
    }

    map.addOverlay(result.start.point.coordinates, 'map-marker-start with-background', 'center-center');
    map.addOverlay(result.end.point.coordinates, 'map-marker-end with-background', 'center-center');
    map.vectorLayer.getSource().addFeature(line);
    map.vectorLayer.setVisible(true);
    map.fitExtent(bounds, true, { padding: [40, 40, 40, 440] });

    setDirectionsState({
        fromTerm: data.start.name,
        fromPoint: data.start.point.coordinates,
        toTerm: data.end.name,
        toPoint: data.end.point.coordinates,
        results
    });
}

import { boundingExtent, buffer as bufferExtent } from 'ol/extent';
import { displayLatLong } from '../map/util';
import { fetchWrapper } from '../util';
import { queryPoint, queryResults, queryError } from './stores';

export async function submitQuery({ term, point, myLocation }, map, suppressErrors = false) {
    map.clearOverlays();

    if (!term.trim()) {
        return;
    }

    if (term.trim().toLowerCase() === 'my location') {
        const { position } = myLocation;
        if (position) {
            const latLong = displayLatLong(position);
            const result = { name: latLong, coordinates: position };
            map.setCenter(position);
            queryResults.set([result]);
        } else {
            queryPoint.set(null);
            queryError.set({
                title: 'Location Unavailable',
                explanation: 'Your location is currently unavailable',
                detail: 'You may need to enable location services in your browser'
            });
            queryResults.set([]);
        }
        return;
    }

    const params = { term };

    if (point) {
        params.point = displayLatLong(point, ',');
    }

    const data = await fetchWrapper('/query', params, suppressErrors);

    if (data === null) {
        return null;
    } else if (data.error && !data.results) {
        queryPoint.set(null);
        queryError.set(data.error);
        queryResults.set([]);
        return null;
    }

    const results = data.results;

    if (results.length === 1) {
        map.setCenter(results[0].coordinates, undefined, true);
        map.zoomToStreetLevel();
    } else {
        const coordinates = results.map(result => result.coordinates);
        const bounds = boundingExtent(coordinates);
        const extent = bufferExtent(bounds, 100);
        map.fitExtent(extent, true);
    }

    queryPoint.set(null);
    queryError.set(null);
    queryResults.set(results);
}

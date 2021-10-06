import { fetchWrapper } from '../fetch';
import { displayLatLong } from '../map/util';

export async function submitQuery(state, map, myLocation, suppressErrors = false) {
    const { term } = state;
    let { point } = state;

    map.clearOverlays();

    if (!term.trim()) {
        return {};
    }

    if (term.trim().toLowerCase() === 'my location') {
        const { position } = myLocation;
        if (position) {
            const latLong = displayLatLong(position);
            const result = { name: latLong, coordinates: position };
            map.setCenter(position);
            return { term: 'My Location', point: position, results: [result] };
        } else {
            return { term, error: myLocation.error };
        }
    }

    const params = { term, point: undefined };

    if (point) {
        if (typeof point !== 'string') {
            point = displayLatLong(point, ',');
        }
        params.point = point;
    }

    const data = await fetchWrapper('/query', params, suppressErrors);

    if (data === null) {
        // Request aborted
        return null;
    } else if (data.error && !data.results) {
        return { term, error: data.error };
    }

    return { term, results: data.results };
}

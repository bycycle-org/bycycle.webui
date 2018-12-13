import { get as getProjection } from 'ol/proj';


export const ANIMATION_DURATION = 250;
export const DEBUG = process.env.REACT_APP_DEBUG === '1';

// TODO: Get labels dynamically from map
let baseLayers = ['Map', 'Satellite', 'OpenStreetMap'];
if (DEBUG) {
    baseLayers = ['Debug'].concat(baseLayers);
}
export const BASE_LAYER_LABELS = baseLayers;

export const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
export const GEOGRAPHIC_SRID = '4326';
export const GEOGRAPHIC_PROJECTION = getProjection(`EPSG:${GEOGRAPHIC_SRID}`);
export const NATIVE_SRID = '3857';
export const NATIVE_PROJECTION = getProjection(`EPSG:${NATIVE_SRID}`);
export const MIN_ZOOM = 4;
export const MAX_ZOOM = 19;
export const STREET_LEVEL_ZOOM = 17;

import { get as getProjection } from 'ol/proj';

export const DEBUG = JSON.parse(process.env.DEBUG || 'false');

export const ANIMATION_DURATION = 500;

export const DEFAULT_CENTER = [-13655274.508685641, 5704240.981993447];

export const DEFAULT_ZOOM = 15;
export const MAX_ZOOM = 19;
export const MIN_ZOOM = 4;
export const OVERVIEW_SWITCHER_ZOOM = 12;
export const STREET_LEVEL_ZOOM = 17;

export const GEOGRAPHIC_SRID = '4326';
export const GEOGRAPHIC_PROJECTION = getProjection(`EPSG:${GEOGRAPHIC_SRID}`);
export const NATIVE_SRID = '3857';
export const NATIVE_PROJECTION = getProjection(`EPSG:${NATIVE_SRID}`);

export const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
export const MAPBOX_API_URL = '//api.mapbox.com';

export const MY_LOCATION_ACCURACY_THRESHOLD = 50;

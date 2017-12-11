import proj from 'ol/proj';


export const ANIMATION_DURATION = 250;
export const DUMMY_MAP = process.env.REACT_APP_DUMMY_MAP === '1';
// TODO: Get labels dynamically from map
export const BASE_LAYER_LABELS = (
    DUMMY_MAP ?
        ['Streets', 'Intersections'] :
        ['Map', 'Satellite', 'OpenStreetMap']
);
export const GEOGRAPHIC_PROJECTION = proj.get('EPSG:4326');
export const NATIVE_PROJECTION = proj.get('EPSG:3857');
export const MIN_ZOOM = 4;
export const MAX_ZOOM = 19;
export const STREET_LEVEL_ZOOM = 17;

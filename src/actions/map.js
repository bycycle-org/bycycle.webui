import { DEFAULT_STATE } from '../reducers/map';

export const SET_MAP_STATE = 'SET_MAP_STATE';
export const SET_BASE_LAYER = 'SET_BASE_LAYER';
export const SET_CENTER = 'SET_CENTER';
export const SET_EXTENT = 'SET_EXTENT';
export const SET_MAP_CONTEXT_MENU_STATE = 'SET_MAP_CONTEXT_MENU_STATE';
export const SET_ZOOM = 'SET_ZOOM';
export const ZOOM_IN = 'ZOOM_IN';
export const ZOOM_OUT = 'ZOOM_OUT';


export function setMapState (state = {}, onlyIfNotVisible = false) {
    return {
        type: SET_MAP_STATE,
        state,
        onlyIfNotVisible
    }
}


export function setBaseLayer (label) {
    return {
        type: SET_BASE_LAYER,
        baseLayer: label
    }
}


export function setCenter (center, zoom, onlyIfNotVisible = false) {
    return {
        type: SET_CENTER,
        center,
        zoom,
        onlyIfNotVisible
    }
}


export function setExtent (extent, onlyIfNotVisible = false) {
    return {
        type: SET_EXTENT,
        extent,
        onlyIfNotVisible
    }
}


export function setZoom (zoom) {
    return {
        type: SET_ZOOM,
        zoom
    }
}


export function zoomIn () {
    return {
        type: ZOOM_IN,
    }
}


export function zoomOut () {
    return {
        type: ZOOM_OUT,
    }
}


export function zoomToFullExtent () {
    return {
        type: SET_CENTER,
        center: DEFAULT_STATE.center,
        zoom: DEFAULT_STATE.zoom
    }
}


export function setMapContextMenuState (open, top, left) {
    return {
        type: SET_MAP_CONTEXT_MENU_STATE,
        contextMenu: { open, top, left }
    }
}

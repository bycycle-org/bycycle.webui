import axios from 'axios';

import trim from 'lodash/trim';

import extent from 'ol/extent';

import { makeApiUrl } from '../util';
import { decProgressCounter, incProgressCounter } from './index';
import { setExtent } from './map';


export const SET_DIRECTIONS_STATE = 'SET_DIRECTIONS_STATE';
export const RESET_DIRECTIONS_STATE = 'RESET_DIRECTIONS_STATE';
export const SET_FROM = 'SET_FROM';
export const SET_TO = 'SET_TO';
export const SET_DIRECTIONS_ERROR = 'SET_DIRECTIONS_ERROR';
export const SET_DIRECTIONS_RESULTS = 'SET_DIRECTIONS_RESULTS';
export const SELECT_DIRECTIONS_RESULT = 'SELECT_DIRECTIONS_RESULT';


const URL = makeApiUrl('/directions');


export function getDirections (suppressErrors = false, selectIfOne = true) {
    return (dispatch, getState) => {
        const state = getState();
        const { from, fromPoint, to, toPoint } = state.directions;

        if (!(trim(from) && trim(to))) {
            return dispatch(resetDirectionsState({ from, to }));
        }

        let params = { from, to };

        if (fromPoint) {
            params.from_point = `${fromPoint[0]},${fromPoint[1]}`;
        }

        if (toPoint) {
            params.to_point = `${toPoint[0]},${toPoint[1]}`;
        }

        dispatch(resetDirectionsState({ from, to }));
        dispatch(incProgressCounter());

        axios.get(URL, { params })
            .then(response => {
                const results = response.data.results;
                const numResults = results.length;

                if (numResults === 0) {
                    return;
                }

                const bounds = extent.createEmpty();
                let state;

                for (let result of results) {
                    extent.extend(bounds, result.bounds);
                }

                if (results.length === 1 && selectIfOne) {
                    const result = results[0];
                    const start = result.start;
                    const end = result.end;
                    state = {
                        results: [],
                        selectedResult: result,
                        from: start.name,
                        fromPoint: start.geom.coordinates,
                        to: end.name,
                        toPoint: end.geom.coordinates
                    };
                } else {
                    state = { results };
                }

                dispatch(setDirectionsState(state));
                dispatch(setExtent(extent.buffer(bounds, 100)));
            })
            .catch(error => {
                if (error.response) {
                    if (!suppressErrors) {
                        const data = error.response.data;
                        dispatch(setDirectionsError(data.error));
                    }
                } else if (error.request) {
                    dispatch(setDirectionsError({
                        title: 'Error',
                        explanation: 'Unable to get directions at this time',
                        detail: process.env.REACT_APP_DEBUG ? error.message : null
                    }));
                } else {
                    console.log(error.config);
                }
            })
            .finally(() => {
                dispatch(decProgressCounter());
            })
    }
}


export function setDirectionsState (state = {}) {
    return {
        type: SET_DIRECTIONS_STATE,
        state
    }
}


export function resetDirectionsState (state = {}) {
    return {
        type: RESET_DIRECTIONS_STATE,
        state
    }
}


export function setFrom (from, fromPoint) {
    return {
        type: SET_FROM,
        from,
        fromPoint
    };
}


export function setTo (to, toPoint) {
    return {
        type: SET_TO,
        to,
        toPoint
    };
}


export function swapFromAndTo () {
    return (dispatch, getState) => {
        const state = getState().directions;
        dispatch(setDirectionsState({
            from: state.to,
            fromPoint: state.toPoint,
            to: state.from,
            toPoint: state.fromPoint,
            selectedResult: null,
            results: []
        }));
        dispatch(getDirections());
    }
}


export function setDirectionsError (error) {
    return {
        type: SET_DIRECTIONS_ERROR,
        error
    }
}


export function setDirectionsResults (results) {
    return {
        type: SET_DIRECTIONS_RESULTS,
        results
    }
}


export function selectDirectionsResult (result) {
    return {
        type: SELECT_DIRECTIONS_RESULT,
        result
    }
}

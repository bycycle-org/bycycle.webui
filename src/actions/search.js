import axios from 'axios';

import { boundingExtent, buffer as bufferExtent } from 'ol/extent';

import { makeApiUrl } from '../util';
import { decProgressCounter, incProgressCounter } from './index';
import { setExtent } from './map';

export const SET_SEARCH_STATE = 'SET_SEARCH_STATE';
export const RESET_SEARCH_STATE = 'RESET_SEARCH_STATE';
export const SET_SEARCH_TERM = 'SET_SEARCH_TERM';
export const SET_SEARCH_RESULTS = 'SET_SEARCH_RESULTS';
export const SET_SEARCH_ERROR = 'SET_SEARCH_ERROR';
export const SELECT_SEARCH_RESULT = 'SELECT_SEARCH_RESULT';


const URL = makeApiUrl('/search');


export function doSearch (suppressErrors = false, selectIfOne = false) {
    return (dispatch, getState) => {
        const state = getState().search;
        const { term, termPoint } = state;

        if (!term.trim()) {
            return dispatch(resetSearchState());
        }

        let params = { term };

        if (termPoint) {
            params.point = `${termPoint[0]},${termPoint[1]}`;
        }

        dispatch(resetSearchState({ term }));
        dispatch(incProgressCounter());

        axios.get(URL, { params })
            .then(response => {
                const results = response.data.results;
                const numResults = results.length;

                if (numResults === 0) {
                    return;
                }

                const coordinates = results.map(result => result.geom.coordinates);
                const bounds = boundingExtent(coordinates);
                let state;

                if (numResults === 1 && selectIfOne) {
                    const result = results[0];
                    state = {
                        results: [],
                        selectedResult: result,
                        term: result.name,
                        termPoint: result.geom.coordinates
                    }
                } else {
                    state = { results };
                }

                dispatch(setSearchState(state));
                dispatch(setExtent(bufferExtent(bounds, 100), true));
            })
            .catch(error => {
                if (error.response) {
                    if (!suppressErrors) {
                        const data = error.response.data;
                        dispatch(setSearchError(data.error));
                    }
                } else if (error.request) {
                    dispatch(setSearchError({
                        title: 'Error',
                        explanation: 'Unable to search at this time',
                        detail: process.env.REACT_APP_DEBUG ? error.message : null
                    }));
                } else {
                    console.error(error);
                }
            })
            .finally(() => {
                dispatch(decProgressCounter());
            })
    }
}


export function setSearchState (state = {}) {
    return {
        type: SET_SEARCH_STATE,
        state
    }
}


export function resetSearchState (state = {}) {
    return {
        type: RESET_SEARCH_STATE,
        state
    }
}


export function setSearchTerm (term, termPoint) {
    return {
        type: SET_SEARCH_TERM,
        term,
        termPoint
    }
}


export function setSearchError (error) {
    return {
        type: SET_SEARCH_ERROR,
        error
    }
}


export function setSearchResults (results) {
    return {
        type: SET_SEARCH_RESULTS,
        results
    }
}


export function selectSearchResult (result) {
    return {
        type: SELECT_SEARCH_RESULT,
        result
    }
}

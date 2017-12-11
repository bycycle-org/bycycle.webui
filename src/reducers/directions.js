import {
    SET_DIRECTIONS_STATE,
    RESET_DIRECTIONS_STATE,
    SET_FROM,
    SET_TO,
    SET_DIRECTIONS_ERROR
} from '../actions/directions';

import { SELECT_DIRECTIONS_RESULT, SET_DIRECTIONS_RESULTS } from '../actions';


export const DEFAULT_STATE = {
    from: '',
    to: '',
    fromPoint: null,
    toPoint: null,
    error: null,
    results: [],
    selectedResult: null
};


export default function reducer (state = DEFAULT_STATE, action) {
    switch (action.type) {
        case SET_DIRECTIONS_STATE:
            return {
                ...state,
                ...action.state
            }
        case RESET_DIRECTIONS_STATE:
            return {
                ...DEFAULT_STATE,
                ...action.state
            }
        case SET_FROM:
            return {
                ...state,
                from: action.from,
                fromPoint: action.fromPoint
            }
        case SET_TO:
            return {
                ...state,
                to: action.to,
                toPoint: action.toPoint
            }
        case SET_DIRECTIONS_RESULTS:
            return {
                ...state,
                results: action.results
            }
        case SET_DIRECTIONS_ERROR:
            return {
                ...state,
                error: action.error
            }
        case SELECT_DIRECTIONS_RESULT:
            const result = action.result;
            const start = result.start;
            const end = result.end;
            return {
                ...state,
                selectedResult: result,
                from: start.name,
                fromPoint: start.geom.coordinates,
                to: end.name,
                toPoint: end.geom.coordinates,
                results: []
            }
        default:
            return state;
    }
}

import {
    SET_SEARCH_STATE,
    RESET_SEARCH_STATE,
    SET_SEARCH_TERM,
    SET_SEARCH_RESULTS,
    SET_SEARCH_ERROR,
    SELECT_SEARCH_RESULT,
} from '../actions/search';


export const DEFAULT_STATE = {
    term: '',
    termPoint: null,
    error: null,
    results: [],
    selectedResult: null
};


export default function reducer (state = DEFAULT_STATE, action) {
    switch (action.type) {
        case SET_SEARCH_STATE:
            return {
                ...state,
                ...action.state
            }
        case RESET_SEARCH_STATE:
            return {
                ...DEFAULT_STATE,
                ...action.state
            }
        case SET_SEARCH_TERM:
            return {
                ...state,
                term: action.term,
                termPoint: action.termPoint
            }
        case SET_SEARCH_RESULTS:
            return {
                ...state,
                results: action.results
            }
        case SET_SEARCH_ERROR:
            return {
                ...state,
                error: action.error
            }
        case SELECT_SEARCH_RESULT:
            const result = action.result;
            return {
                ...state,
                selectedResult: result,
                term: result.name,
                termPoint: result.geom.coordinates,
                results: []
            }
        default:
            return state;
    }
}

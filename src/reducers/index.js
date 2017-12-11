import { combineReducers } from 'redux';

import {
    INC_PROGRESS_COUNTER,
    DEC_PROGRESS_COUNTER,
    SET_FUNCTION,
    SET_INFO,
    SET_MENU_STATE
} from '../actions';

import directions from './directions';
import map from './map';
import search from './search';


export const DEFAULT_STATE = {
    function: 'search',
    info: {},
    menuOpen: false,
    progressCounter: 0
};


function main (state = DEFAULT_STATE, action) {
    switch (action.type) {
        case SET_FUNCTION:
            return {
                ...state,
                function: action.function
            }
        case SET_INFO:
            return {
                ...state,
                info: action.info
            }
        case SET_MENU_STATE:
            const menuOpen = typeof action.open === 'undefined' ? !state.menuOpen : action.open;
            return {
                ...state,
                menuOpen
            }
        case INC_PROGRESS_COUNTER:
            return {
                ...state,
                progressCounter: state.progressCounter + 1
            }
        case DEC_PROGRESS_COUNTER:
            return {
                ...state,
                progressCounter: state.progressCounter - 1
            }
        default:
            return state;
    }
}


export default combineReducers({
    main,
    directions,
    map,
    search
});

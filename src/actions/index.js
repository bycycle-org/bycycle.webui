export * from './directions';
export * from './map';
export * from './search';


export const SET_FUNCTION = 'SET_FUNCTION';
export const SET_INFO = 'SET_INFO';
export const SET_MENU_STATE = 'SET_MENU_STATE';
export const INC_PROGRESS_COUNTER = 'INC_PROGRESS_COUNTER';
export const DEC_PROGRESS_COUNTER = 'DEC_PROGRESS_COUNTER';


export function setFunction (name) {
    return {
        type: SET_FUNCTION,
        function: name
    }
}


export function setInfo (info) {
    return {
        type: SET_INFO,
        info
    }
}


export function setMenuState (open) {
    return {
        type: SET_MENU_STATE,
        open
    }
}


export function incProgressCounter () {
    return {
        type: INC_PROGRESS_COUNTER
    }
}


export function decProgressCounter () {
    return {
        type: DEC_PROGRESS_COUNTER
    }
}

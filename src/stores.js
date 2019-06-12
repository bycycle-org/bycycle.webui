import { writable } from 'svelte/store';
import { setDirectionsState } from './directions/stores';
import { setQueryState } from './query/stores';

export const QUERY = 'QUERY';
export const DIRECTIONS = 'DIRECTIONS';

export const abortStore = writable(null);
export const currentFunction = writable(QUERY);

export const abortRequest = () => {
    const controller = new AbortController();
    abortStore.update(value => {
        if (value) {
            value.controller.abort();
        }
        return { controller, signal: controller.signal };
    });
    return controller;
};

// Progress counter
export const progressCounter = (() => {
    const { subscribe, set, update } = writable(1);
    return {
        subscribe,
        increment: () => update(n => n + 1),
        decrement: () => update(n => n - 1),
        reset: () => set(0)
    };
})();

export const switchToDirections = state => {
    if (state) {
        setDirectionsState(state);
    }
    currentFunction.set(DIRECTIONS);
};

export const switchToQuery = state => {
    if (state) {
        setQueryState(state);
    }
    currentFunction.set(QUERY);
};

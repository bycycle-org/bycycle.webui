import { writable } from 'svelte/store';

export const queryTerm = writable('');
export const queryPoint = writable(null);
export const queryResults = writable([]);
export const queryError = writable(null);

export const setQueryState = (state = {}) => {
    const { term, point, results, error } = state;
    queryTerm.set(term || '');
    queryPoint.set(point || null);
    queryResults.set(results || []);
    queryError.set(error || null);
};

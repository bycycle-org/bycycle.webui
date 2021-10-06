import { writable } from 'svelte/store';
export * from './map/stores';

export const abortStore = writable(null);

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

export const progressCounter = (() => {
    const { subscribe, set, update } = writable(1);
    return {
        subscribe,
        increment: () => update(n => n + 1),
        decrement: () => update(n => n - 1),
        reset: () => set(0)
    };
})();

// URL Routing
export const currentRoute = writable({});

export const currentUrl = (() => {
    const store = writable({ routeName: 'home', path: '/', params: {}, queryParams: {} });
    return {
        set: store.set,
        update: store.update,
        subscribe: (routeName, run) => {
            return store.subscribe(data => {
                return data.routeName === routeName ? run(data) : undefined;
            });
        }
    }
})();

import page from 'page';
import { tick } from 'svelte';
import { queryStringToParams } from './util';
import { displayLatLong } from './map/util';

const routes = {
    'home': {
        path: '/',
        component: 'Query'
    },
    'search': {
        basePath: '/search',
        path: new RegExp([
            '^/search',
            '(/([^/]+?)(@([+-]?\\d+\\.\\d+,[+-]\\d+\\.\\d+))?)?$'
        ].join('')),
        // XXX: Workaround for lack of named regex groups
        groups: {
            term: 1,
            point: 3,
        },
        makePath: ({ term, point }) => {
            return pathSegmentForTermAndPoint(term, point);
        },
        component: 'Query'
    },
    'directions': {
        basePath: '/directions',
        path: new RegExp([
            '^/directions',
            '(/(([^/]+?)(@([+-]?\\d+\\.\\d+,[+-]\\d+\\.\\d+))?|)',
            '(/([^/]+?)(@([+-]?\\d+\\.\\d+,[+-]\\d+\\.\\d+))?)?)?$'
        ].join('')),
        // XXX: Workaround for lack of named regex groups
        groups: {
            fromTerm: 2,
            fromPoint: 4,
            toTerm: 6,
            toPoint: 8
        },
        makePath: ({ fromTerm, fromPoint, toTerm, toPoint }) => {
            const fromSegment = pathSegmentForTermAndPoint(fromTerm, fromPoint);
            const toSegment = pathSegmentForTermAndPoint(toTerm, toPoint);
            if (toSegment) {
                return [fromSegment || '', toSegment];
            } else if (fromSegment) {
                return [fromSegment];
            }
            return [];
        },
        component: 'Directions'
    },
    'default': {
        path: '*',
        component: 'Query'
    }
};

export function configureRoutes(components, currentRoute, currentUrl) {
    page('*', (ctx, next) => {
        ctx.queryParams = queryStringToParams(ctx.querystring);
        next();
    });

    for (const routeName of Object.keys(routes)) {
        const route = routes[routeName];
        const component = components[route.component];
        const groups = route.groups;

        if (!component) {
            throw new Error(`Unknown component: ${route.component}`);
        }

        route.name = routeName;
        route.component = component;

        if (!route.basePath) {
            route.basePath = `${route.path}`;
        }

        page(route.path, async ctx => {
            currentRoute.set(route);
            await tick();

            const { path, params, queryParams } = ctx;

            // XXX: Workaround for lack of named regex groups
            if (groups) {
                Object.keys(groups).forEach(name => {
                    const i = groups[name];
                    const value = params[i];
                    if (typeof value !== 'undefined') {
                        params[name] = value;
                    }
                })
            }

            currentUrl.set({ routeName, path, params, queryParams });
        });
    }
    // Configure page.js; without this, page.js does nothing.
    page({ decodeURLComponents: false });
}

/* External API */

export function setCurrentRoute(name, params = {}) {
    const route = getRoute(name);
    const path = routePath(route, params);
    return page(path);
}

/**
 * Set the current URL without navigating.
 */
export function pushState(name, params = {}, data = {}, title = '', replace = false) {
    const route = getRoute(name);
    const path = routePath(route, params);
    history[replace ? 'replaceState' : 'pushState']({ ...data, path }, title, path);
}

/**
 * Replace the current URL without navigating.
 */
export function replaceState(name, params = {}, data = {}, title = '') {
    pushState(name, params, data, title, true);
}

/* Utilities */

function getRoute(name) {
    const route = routes[name];
    if (!route) {
        throw new Error(`Unknown route: ${name}`);
    }
    return route;
}

function routePath(route, params = {}) {
    let segments = route.makePath ? route.makePath(params) : [];
    segments = typeof segments === 'string' ? [segments] : segments;
    segments = segments.map(segment => encodeURIComponent(segment));
    return [route.basePath, ...segments].join('/')
}

function pathSegmentForTermAndPoint(term, point) {
    if (point && typeof point !== 'string') {
        point = displayLatLong(point, ',');
    }
    if (point && point.replace(/ +/, '') === term.replace(/ +/, '')) {
        point = null;
    }
    return point ? `${term}@${point}` : term || '';
}

function encodeURIComponent(string) {
    return window.encodeURIComponent(string)
        .replace(/%40/g, () => '@')
        .replace(/%2C/g, () => ',');
}

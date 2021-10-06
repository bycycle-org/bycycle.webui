import { configureRoutes } from './routes';
import { currentRoute, currentUrl } from './stores';

import App from './App.svelte';
import Directions from './directions/Directions.svelte';
import Query from './query/Query.svelte';

const app = new App({
    target: document.body
});

configureRoutes({
    Directions,
    Query
}, currentRoute, currentUrl);

export default app;

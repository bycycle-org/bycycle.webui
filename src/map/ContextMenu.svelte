<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import {
        directionsFromTerm,
        directionsFromPoint,
        directionsToTerm,
        directionsToPoint,
        directionsError
    } from '../directions/stores';
    import { getDirections } from '../directions';
    import { submitQuery } from '../query';
    import { queryTerm, queryPoint, queryResults, queryError } from '../query/stores';
    import { currentFunction, switchToDirections, switchToQuery } from '../stores';
    import { contextMenuStore, locationStore } from './stores';
    import { displayLatLong } from './util';

    export let map;

    const osmBaseUrl = '//www.openstreetmap.org/#map=17/';
    const style = { display: 'none', top: 0, right: 0, bottom: 0, left: 0 };

    let osmUrl = osmBaseUrl;

    $: {
        const [mapWidth, mapHeight] = map.getSize();
        const { open, x, y } = $contextMenuStore;

        style.display = open ? 'block' : 'none';

        if (open) {
            osmUrl = `${osmBaseUrl}${displayLatLong(getCoordinate(), '/')}`;
        }

        if (x < mapWidth / 2) {
            style.left = `${x}px`;
            style.right = 'auto';
        } else {
            style.left = 'auto';
            style.right = `${mapWidth - x}px`;
        }

        if (y < mapHeight / 2) {
            style.top = `${y}px`;
            style.bottom = 'auto';
        } else {
            style.top = 'auto';
            style.bottom = `${mapHeight - y}px`;
        }
    }

    function handleWhatIsHere() {
        const coordinate = getCoordinate();
        const latLong = displayLatLong(coordinate);
        const args = { term: latLong, point: coordinate, myLocation: $locationStore };

        if ($currentFunction !== 'QUERY') {
            switchToQuery();
        }

        $queryTerm = latLong;
        $queryPoint = coordinate;
        $queryError = null;

        // XXX: Setting this here keeps results from updating after the
        //      first time this function is called. I have no idea why.
        // $queryResults = [];

        submitQuery(args, map);
    }

    function handleGetDirectionsFrom() {
        const coordinate = getCoordinate();
        const latLong = displayLatLong(coordinate);
        const args = {
            fromTerm: latLong,
            fromPoint: coordinate,
            toTerm: $directionsToTerm || 'My Location',
            toPoint: $directionsToPoint,
            myLocation: $locationStore
        };
        if ($currentFunction !== 'DIRECTIONS') {
            switchToDirections();
        }
        getDirections(args, map);
    }

    function handleGetDirectionsTo() {
        const coordinate = getCoordinate();
        const latLong = displayLatLong(coordinate);
        const args = {
            fromTerm: $directionsFromTerm || 'My Location',
            fromPoint: $directionsFromPoint,
            toTerm: latLong,
            toPoint: coordinate,
            myLocation: $locationStore
        };
        switchToDirections(args);
        getDirections(args, map);
    }

    function handleCenterMapHere() {
        map.setCenter(getCoordinate());
    }

    function handleZoomInHere() {
        map.setCenter(getCoordinate());
        map.zoomToStreetLevel();
    }

    function getCoordinate() {
        return map.getCoordinateFromPixel([$contextMenuStore.x, $contextMenuStore.y]);
    }
</script>

<style type="text/scss">
    @import 'styles/variables';

    #context-menu {
        position: absolute;
        z-index: 50;
        list-style: none;
        margin: 0;
        padding: 0;
        background-color: white;
        box-shadow: 2px 2px 4px;
        border-radius: 1px;

        > li {
            margin: 0;
            padding: 0;

            &:hover {
                background-color: #f8f8f8;
            }

            > a {
                color: $text-color;
                display: block;
                width: 100%;
                font-size: 14px;
                line-height: 24px;
                padding: 0 4px;
                text-decoration: none;

                &:hover {
                    color: $link-hover-color;
                }
            }
        }
    }
</style>

<ul
    id="context-menu"
    style="display: {style.display}; top: {style.top}; right: {style.right}; bottom: {style.bottom};
    left: {style.left}"
    on:contextmenu|stopPropagation
    transition:fade={{ duration: 150 }}>
    <li>
        <a href="#what-is-here" on:click|preventDefault={handleWhatIsHere}>
            What's here
        </a>
    </li>
    <li>
        <a href="#get-directions-from" on:click|preventDefault={handleGetDirectionsFrom}>
            Get directions from
        </a>
    </li>
    <li>
        <a href="#get-directions-to" on:click|preventDefault={handleGetDirectionsTo}>
            Get directions to
        </a>
    </li>
    <li>
        <a href="#center-map-here" on:click|preventDefault={handleCenterMapHere}>Center map here</a>
    </li>
    <li>
        <a href="#zoom-in-here" on:click|preventDefault={handleZoomInHere}>Zoom in here</a>
    </li>
    <li>
        <a href={osmUrl}>View on OpenStreetMap</a>
    </li>
</ul>

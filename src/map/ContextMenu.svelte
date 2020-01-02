<svelte:options immutable={true} />

<script>
    import { getContext } from 'svelte';
    import { setCurrentRoute } from '../routes';
    import { displayLatLong } from './util';

    const map = getContext('map');
    const osmBaseUrl = '//www.openstreetmap.org/#map=17/';

    export let open = false;
    export let pixel = [0, 0];

    let element;
    let osmUrl = osmBaseUrl;
    let style;

    $: {
        if (element && open) {
            const [x, y] = pixel;
            const [mapWidth, mapHeight] = map.getSize();
            let top, right, bottom, left;

            for (const anchor of element.querySelectorAll('li > a')) {
                anchor.classList.add('map-context-menu-item');
            }

            osmUrl = `${osmBaseUrl}${getCoordinate(true, '/')}`;

            if (x < mapWidth / 2) {
                left = `${x}px`;
                right = 'auto';
            } else {
                left = 'auto';
                right = `${mapWidth - x}px`;
            }

            if (y < mapHeight / 2) {
                top = `${y}px`;
                bottom = 'auto';
            } else {
                top = 'auto';
                bottom = `${mapHeight - y}px`;
            }

            style = `top: ${top}; right: ${right}; bottom: ${bottom}; left: ${left};`;
        }
    }

    function close() {
        open = false;
    }

    function handleClick (event) {
        const target = event.target;
        if (target.tagName === 'A') {
            const href = target.getAttribute('href');
            if (href.charAt(0) === '#') {
                event.preventDefault();
            }
        }
        event.stopPropagation();
        close();
    }

    function handleWhatIsHere() {
        const coordinate = getCoordinate(true);
        setCurrentRoute('search', { term: coordinate });
    }

    function handleGetDirectionsFrom() {
        const coordinate = getCoordinate(true);
        setCurrentRoute('directions', { fromTerm: coordinate, toTerm: '?' });
    }

    function handleGetDirectionsTo() {
        const coordinate = getCoordinate(true);
        setCurrentRoute('directions', { fromTerm: '?', toTerm: coordinate });
    }

    function handleCenterMapHere() {
        map.setCenter(getCoordinate());
    }

    function handleZoomInHere() {
        map.setCenter(getCoordinate());
        map.zoomToStreetLevel();
    }

    function getCoordinate(display = false, sep = ',') {
        const coordinate = map.getCoordinateFromPixel(pixel);
        if (display) {
            return displayLatLong(coordinate, sep);
        }
        return coordinate;
    }
</script>

<style type="text/scss">
    @import 'styles/variables';

    @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    ul {
        position: absolute;
        z-index: 50;
        list-style: none;
        margin: 0;
        padding: 0;

        animation: fade-in 500ms;
        background-color: white;
        box-shadow: 2px 2px 4px;
        border-radius: $border-radius;

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

{#if open}
    <ul bind:this={element}
        on:click={handleClick}
        on:contextmenu|stopPropagation
        style={style}
    >
        <li>
            <a href="#what-is-here" on:click={handleWhatIsHere}>
                What's here?
            </a>
        </li>
        <li>
            <a href="#get-directions-from" on:click={handleGetDirectionsFrom}>
                Get directions from
            </a>
        </li>
        <li>
            <a href="#get-directions-to" on:click={handleGetDirectionsTo}>
                Get directions to
            </a>
        </li>
        <li>
            <a href="#center-map-here"on:click={handleCenterMapHere}>
                Center map here
            </a>
        </li>
        <li>
            <a href="#zoom-in-here" on:click={handleZoomInHere}>
                Zoom in here
            </a>
        </li>
        <li>
            <a href={osmUrl}>
                View on OpenStreetMap
            </a>
        </li>
    </ul>
{/if}

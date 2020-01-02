<script>
    import Hammer from 'hammerjs';
    import { getContext, onMount, tick } from 'svelte';
    import { currentLocation } from '../stores';
    import { DEFAULT_CENTER, STREET_LEVEL_ZOOM } from './const';
    import ContextMenu from './ContextMenu.svelte';
    import OverviewSwitcher from './OverviewSwitcher.svelte';

    const map = getContext('map');

    let mapElement;
    let contextMenuOpen = false;
    let contextMenuPixel = [0, 0];
    let contextMenuClosedViaPointerDown = false;

    onMount(() => {
        map.setTarget(mapElement);
        map.setDefaultCenter().then(() => {
            currentLocation.subscribe(locationData => {
                map.showMyLocation(locationData);
            });

            const startTime = new Date().getTime();
            const unsubscribe = currentLocation.subscribe(async locationData => {
                // During the first 5 seconds after the map has loaded,
                // center/zoom in on the user's current location.
                const now = new Date().getTime();
                const [defaultX, defaultY] = DEFAULT_CENTER;
                const [x, y] = map.getCenter();
                const moved = defaultX !== x || defaultY !== y;

                if (moved || (now - startTime) > 5000) {
                    await tick();
                    unsubscribe();
                } else if (locationData.position) {
                    map.setCenter(locationData.position, STREET_LEVEL_ZOOM);
                }
            });
        });

        // Open map context menu on long press.
        new Hammer.Manager(mapElement, {
            recognizers: [
                [Hammer.Press, { time: 500 }]
            ]
        }).on('press', event => {
            handleContextMenu(event);
        });

        // Close map context menu immediately on pointer down. I.e.,
        // don't wait for a full click.
        document.body.addEventListener('pointerdown', event => {
            if (event.target.classList.contains('map-context-menu-item')) {
                event.stopPropagation();
                return false;
            }
            if (contextMenuOpen) {
                closeContextMenu();
                contextMenuClosedViaPointerDown = true;
            }
        }, true);

        // Stop click after closing map context menu. This keeps buttons
        // from being activated when closing the context menu.
        document.body.addEventListener('click', event => {
            if (contextMenuClosedViaPointerDown) {
                event.preventDefault();
                event.stopPropagation();
                contextMenuClosedViaPointerDown = false;
            }
        }, true);
    });

    function handleContextMenu(event) {
        let x, y;
        switch (event.type) {
            case 'press':
                [x, y] = [event.center.x, event.center.y];
                break;
            case 'contextmenu':
                [x, y] = [event.pageX, event.pageY]
                break;
            default:
                throw new Error(`Unhandled context menu event: ${event.type}`)
        }
        openContextMenu(x, y);
    }

    function openContextMenu(x, y) {
        contextMenuOpen = true;
        contextMenuPixel = [x, y];
    }

    function closeContextMenu() {
        contextMenuOpen = false;
    }

    /* Controls */

    function handleMyLocation() {
        map.setCenter($currentLocation.position);
        map.zoomToStreetLevel();
    }

    function handleZoomToFullExtent() {
        map.zoomToFullExtent();
    }

    function handleZoomIn() {
        map.zoomIn();
    }

    function handleZoomOut() {
        map.zoomOut();
    }
</script>

<style type="text/scss">
    @import 'styles/variables';

    #map {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
    }

    #map > .controls > * {
        box-shadow: 2px 2px 2px $link-color;
    }

    #map > :global(.controls) {
        position: absolute;
        z-index: 1;
    }

    #map > :global(.controls.row),
    #map > :global(.controls.column) {
        display: flex;
        margin: 0;
        padding: 0;
    }

    #map > :global(.controls.row) {
        flex-direction: row;
    }
    #map > :global(.controls.row > *) {
        margin-right: $half-standard-spacing;
    }
    #map > :global(.controls.row > *:last-child) {
        margin-right: 0;
    }

    #map > :global(.controls.column) {
        flex-direction: column;
    }
    #map > :global(.controls.column > *) {
        margin-bottom: $half-standard-spacing;
    }
    #map > :global(.controls.column > *:last-child) {
        margin-bottom: 0;
    }

    #map > :global(.controls.top) {
        top: $half-standard-spacing;
    }
    #map > :global(.controls.right) {
        right: $half-standard-spacing;
    }
    #map > :global(.controls.bottom) {
        bottom: $half-standard-spacing;
    }
    #map > :global(.controls.left) {
        left: $half-standard-spacing;
    }

    @media (min-width: $sm-width) {
        #map > :global(.controls.top) {
            top: $standard-spacing;
        }
        #map > :global(.controls.right) {
            right: $standard-spacing;
        }
        #map > :global(.controls.bottom) {
            bottom: $standard-spacing;
        }
        #map > :global(.controls.left) {
            left: $standard-spacing;
        }
    }
</style>

<div id="map" bind:this={mapElement} on:contextmenu|preventDefault={handleContextMenu}>
    <ContextMenu bind:open={contextMenuOpen} pixel={contextMenuPixel} />

    <OverviewSwitcher />

    <div class="controls bottom right column" on:contextmenu|stopPropagation>
        {#if $currentLocation.position}
            <button title="My location" class="material-icons" on:click="{handleMyLocation}">
                my_location
            </button>
        {/if}
        <button title="Show coverage area" class="material-icons" on:click="{handleZoomToFullExtent}">
            public
        </button>
        <button title="Zoom in" class="material-icons hidden-xs" on:click="{handleZoomIn}">
            add
        </button>
        <button title="Zoom out" class="material-icons hidden-xs" on:click="{handleZoomOut}">
            remove
        </button>
    </div>
</div>

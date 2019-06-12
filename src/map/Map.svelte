<script>
    import { onMount } from 'svelte';
    import { MY_LOCATION_ACCURACY_THRESHOLD, STREET_LEVEL_ZOOM } from './const';
    import { contextMenuStore, locationStore } from './stores';
    import ContextMenu from './ContextMenu.svelte';
    import OverviewSwitcher from './OverviewSwitcher.svelte';

    export let map;
    let showContextMenu = false;

    onMount(() => {
        map.setTarget('map');
        map.setDefaultCenter();

        const checkInterval = 1000;
        let numChecks = 5;
        let doLocationStoreUnsubscribe = false;

        const locationStoreUnsubscribe = locationStore.subscribe(locationData => {
            if (locationData.position) {
                map.setCenter(locationData.position, STREET_LEVEL_ZOOM);
                if (locationData.accuracy < MY_LOCATION_ACCURACY_THRESHOLD) {
                    doLocationStoreUnsubscribe = true;
                }
            }
        });

        const checkLocationStoreUnsubscribe = () => {
            if (doLocationStoreUnsubscribe || !numChecks) {
                locationStoreUnsubscribe();
            } else {
                setTimeout(checkLocationStoreUnsubscribe, checkInterval);
            }
            numChecks -= 1;
        };

        checkLocationStoreUnsubscribe();
    });

    locationStore.subscribe(locationData => {
        map.showMyLocation(locationData);
    });

    function handleContextMenu(event) {
        contextMenuStore.set({
            open: true,
            x: event.pageX,
            y: event.pageY
        });
    }

    /* Controls */

    function handleMyLocation() {
        map.setCenter($locationStore.position);
        map.zoomToStreetLevel();
    }

    function handleZoomToFullExtent() {
        map.setDefaultCenter();
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
        background-color: lighten(lightskyblue, 10%);
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

    @media (max-width: $xs-width) {
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
    }
</style>

<div id="map" on:contextmenu|preventDefault={handleContextMenu}>
    <ContextMenu {map} />

    <OverviewSwitcher mainMap="{map}" mainBaseLayers="{map.baseLayers}" />

    <div class="controls bottom right column" on:contextmenu|stopPropagation>
        <button title="My location" class="material-icons" on:click="{handleMyLocation}">
            my_location
        </button>
        <button title="Reset map view" class="material-icons" on:click="{handleZoomToFullExtent}">
            public
        </button>
        <button title="Zoom in" class="material-icons" on:click="{handleZoomIn}">add</button>
        <button title="Zoom out" class="material-icons" on:click="{handleZoomOut}">remove</button>
    </div>
</div>

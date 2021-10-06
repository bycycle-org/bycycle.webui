<svelte:options immutable={true} />

<script>
    import { getContext, onMount } from 'svelte';
    import { Map, View } from 'ol';
    import LayerGroup from 'ol/layer/Group';
    import { DEFAULT_CENTER, OVERVIEW_SWITCHER_ZOOM } from './const';

    const mainMap = getContext('map');

    let label;
    let activeIndex = 1; // Active on main map
    let nextIndex = 0; // Visible on overview map

    function cloneLayer(layer, props = {}) {
        return new layer.constructor({
            label: layer.get('label'),
            shortLabel: layer.get('shortLabel'),
            visible: false,
            source: layer.getSource(),
            ...props
        });
    }

    const baseLayers = mainMap.baseLayers.map((layer, i) => {
        if (layer.getVisible()) {
            activeIndex = i;
            nextIndex = (i + 1) % mainMap.baseLayers.length;
        }

        if (layer instanceof LayerGroup) {
            return cloneLayer(layer.getLayers().item(0), {
                label: layer.get('label'),
                shortLabel: layer.get('shortLabel')
            });
        } else {
            return cloneLayer(layer);
        }
    });

    const view = new View();

    const map = new Map({
        controls: [],
        interactions: [],
        layers: baseLayers,
        view
    });

    onMount(() => {
        map.setTarget('overview-switcher-map');
        view.setCenter(DEFAULT_CENTER);
        view.setZoom(OVERVIEW_SWITCHER_ZOOM);
        baseLayers[nextIndex].setVisible(true);
        label = baseLayers[nextIndex].get('label');

        mainMap.on('moveend', () => {
            view.animate({ center: mainMap.getCenter(), duration: 50 });
        });

        mainMap.baseLayers.forEach(layer => {
            layer.on('change:visible', event => {
                // XXX: Only trigger for currently-visible base layer
                if (!event.target.getVisible()) {
                    return;
                }

                const baseLayerLabel = event.target.get('label');

                baseLayers.forEach((layer, i) => {
                    const visible = layer.get('label') === baseLayerLabel;
                    layer.setVisible(false);
                    if (visible) {
                        activeIndex = i;
                        nextIndex = (i + 1) % mainMap.baseLayers.length;
                    }
                });

                baseLayers[nextIndex].setVisible(true);
                label = baseLayers[nextIndex].get('shortLabel');
            });
        });
    });

    function handleClick() {
        activeIndex = (activeIndex + 1) % baseLayers.length;
        mainMap.setBaseLayer(mainMap.baseLayers[activeIndex]);
    }
</script>

<style lang="scss">
    @import '../styles/mixins';
    @import '../styles/variables';

    #overview-switcher-map {
        background-color: white;
        border-radius: 2px;
        box-shadow: 2px 2px 2px $link-color;
        cursor: pointer;
        display: none;
        width: $overview-switcher-width;
        height: $overview-switcher-width;

        .label {
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            margin: 0;
            padding: 2px;
            z-index: 1;
            color: black;
            background-color: rgba(255, 255, 255, 0.75);
            border-top: 1px solid white;
            font-size: 14px;
            font-weight: bold;
            line-height: 1;
            text-align: center;
        }

        @media (min-width: $md-width) {
            display: block;
        }

        @media (min-width: $lg-width) {
            width: $overview-switcher-width-lg;
            height: $overview-switcher-width-lg;
            .label {
                font-size: 16px;
            }
        }
    }
</style>

<div
    id="overview-switcher-map"
    title="Switch to {label} layer"
    class="controls bottom left"
    on:click={handleClick}
    on:contextmenu|stopPropagation>
    <div class="label">{label}</div>
</div>

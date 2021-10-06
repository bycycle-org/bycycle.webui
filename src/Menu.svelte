<script>
    import { getContext, onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';

    const map = getContext('map');

    let show = false;
    let height = 'auto';

    $: {
        height = show ? '100%' : 'auto';
    }

    function open() {
        show = true;
    }

    function close() {
        show = false;
    }

    function maybeClose(event) {
        let target = event.target;
        while (target.tagName !== 'A') {
            target = target.parentNode;
            if (target.tagName === 'UL') {
                return false;
            }
        }
        close();
    }
</script>

<style lang="scss">
    @import './styles/mixins';
    @import './styles/variables';

    #container {
        position: absolute;
        width: 100%;
        z-index: 101;
    }

    #open-button {
        position: absolute;
        top: $half-standard-spacing;
        left: $half-standard-spacing;
        z-index: 1;

        @media (min-width: $sm-width) {
            top: $standard-spacing + $half-standard-spacing;
            left: $standard-spacing + $half-standard-spacing;
        }
    }

    #mask {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: rgba(0, 0, 0, 0.5);
    }

    ul#menu {
        position: absolute;
        left: 0;
        width: $menu-width;
        height: 100%;
        z-index: 2;
        margin: 0;
        padding: 0;
        background-color: white;
        list-style: none;
        overflow-y: auto;

        > li {
            &:hover {
                background-color: #f8f8f8;
            }

            .material-icons {
                line-height: unset;
            }

            // Each <li> must contain a top level element
            > * {
                display: flex;
                flex-direction: row;
                align-content: center;

                margin: 0;
                padding: $standard-spacing;

                line-height: $font-size + $twice-standard-spacing;

                > * {
                    margin-right: $half-standard-spacing;
                    &:last-child {
                        margin-right: 0;
                    }
                }
            }

            > a {
                text-decoration: none;
            }

            &#header {
                &:hover {
                    background-color: transparent;
                }
                button.material-icons {
                    border: none;
                }
                h1 {
                    color: $header-color;
                    font-size: $button-width;
                    font-weight: normal;
                    margin: 0;
                    padding: 0;
                    text-shadow: 1px 1px 2px;
                }
            }
        }

        > li.divider {
            border-bottom: 1px solid #e0e0e0;
        }

        > li.info {
            &:hover {
                background-color: transparent;
            }
            > p {
                font-size: 14px;
                font-style: italic;
                line-height: $line-height;
            }
        }

        @media (min-width: $sm-width) {
            width: $menu-width;
        }
    }
</style>

<div id="container" on:touchmove|stopPropagation style="height: {height}">
    <button id="open-button"
            type="button"
            title="Open menu"
            class="material-icons"
            on:click="{open}">menu</button>

    {#if show}
        <div id="mask" on:click={close} transition:fade="{{ duration: 100 }}" />

        <ul id="menu" on:click={maybeClose} transition:fly="{{ x: -320, duration: 150 }}">
            <li id="header">
                <div>
                    <h1>byCycle</h1>
                    <span class="flex-spacer" />
                    <button
                        id="close-button"
                        type="button"
                        title="Close menu"
                        class="material-icons"
                        on:click="{close}">
                        close
                    </button>
                </div>
            </li>

            <li class="divider" />

            {#each map.baseLayers as layer}
                <li>
                    {#if layer === map.baseLayer}
                        <div>
                            <span class="material-icons">layers</span>
                            <span>{layer.get('label')}</span>
                        </div>
                    {:else}
                        <a
                            href="#switch-base-layer"
                            title="Switch to {layer.get('label')} layer"
                            on:click|preventDefault="{e => map.setBaseLayer(layer)}">
                            <span class="material-icons">layers</span>
                            <span>{layer.get('label')}</span>
                        </a>
                    {/if}
                </li>
            {/each}

            <li class="divider" />

            <!-- TODO: -->
            <li style="display: none;">
                <a href="#show-bike-map">
                    <span class="material-icons">directions_bike</span>
                    <span>Bike Map</span>
                </a>
            </li>

            <li class="divider" />

            <li>
                <a href="https://info.bycycle.org/">
                    <span class="material-icons">notifications</span>
                    <span>News</span>
                </a>
            </li>
            <li>
                <a href="https://info.bycycle.org/about/">
                    <span class="material-icons">info</span>
                    <span>About</span>
                </a>
            </li>
            <li>
                <a href="https://info.bycycle.org/code/">
                    <span class="material-icons">code</span>
                    <span>Code</span>
                </a>
            </li>

            <li class="divider" />

            <li class="info">
                <p>
                    byCycle is an experiment in using OpenStreetMap data for routing and geocoding.
                    Search results and directions may be inaccurate or unsuitable. All information
                    presented on this site should be verified via other sources.
                </p>

                <p>&copy; 2004-2007,2012,2014,2017-2019 byCycle.org</p>
            </li>
        </ul>
    {/if}
</div>

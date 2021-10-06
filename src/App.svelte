<svelte:options immutable={true} />

<script>
    import { onMount, setContext } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { Map, MapService } from './map';
    import { currentRoute, progressCounter } from './stores';
    import Menu from './Menu.svelte';

    onMount(() => {
        setTimeout(() => {
            progressCounter.decrement();
        }, 1000);

        document.body.addEventListener('touchmove', event => event.preventDefault(), {
            passive: false
        });
    });

    setContext('map', new MapService());
</script>

<style lang="scss">
    @import './styles/variables';

    #container {
        position: absolute;
        width: 100%;
        height: 100%;
    }

    #loading {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 128px;
        z-index: 3;
        background-color: rgba(255, 255, 255, 0.75);
        border: 1px solid white;
        border-radius: $border-radius;
        color: seagreen;
        text-align: center;
        text-shadow: 1px 1px 1px;
        font-size: 24px;
        line-height: 1;
        padding: $standard-spacing;
        transform: translateX(-50%) translateY(-50%);
    }

    #loading-spinner {
        position: absolute;
        top: calc(50% - 75px);
        left: calc(50% - 75px);
        width: 150px;
        height: 150px;
        z-index: 3;
        border: $standard-spacing solid rgba(255, 255, 255, 0.75);
        border-top: $standard-spacing solid seagreen;;
        border-bottom: $standard-spacing solid seagreen;;
        border-radius: 50%;
        animation: spinner 2s linear infinite;
    }

    #progress-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: $half-standard-spacing - 1px;
        z-index: 3;
        background-color: seagreen;
        box-shadow: 0px 1px 2px darken(seagreen, 10%);
        animation: blinker 1.5s linear infinite;

        @media (min-width: $sm-width) {
            height: $half-standard-spacing;
        }
    }

    header {
        position: absolute;
        bottom: $half-standard-spacing;
        left: $half-standard-spacing;

        z-index: 1;

        background-color: rgba(255, 255, 255, 0.75);
        border-radius: 2px;
        box-shadow: 2px 2px 2px $link-color;
        padding: 4px;

        > h1 {
            margin: 0;
            padding: 0;
            line-height: 1;

            > a {
                color: $header-color;
                display: block;
                font-size: 18px;
                font-weight: normal;
                line-height: 1;
                text-decoration: none;
                text-shadow: 1px 1px 2px;
            }
        }

        @media (min-width: $sm-width) {
            bottom: $standard-spacing;
            left: $standard-spacing;
            > h1 > a {
                font-size: 20px;
            }
        }

        @media (min-width: $md-width) {
            left: (2 * $standard-spacing) + $overview-switcher-width;
            > h1 > a {
                font-size: 24px;
            }
        }

        @media (min-width: $lg-width) {
            left: (2 * $standard-spacing) + $overview-switcher-width-lg;
        }
    }
</style>

<div id="container">
    {#if $progressCounter}
        <div id="progress-bar" transition:fly={{ y: -5 }} />
        <div id="loading-spinner" transition:fade></div>
        <div id="loading" transition:fade><span>Loading</span></div>
    {/if}

    <header title="Get there by cycle!">
        <h1>
            <a href="/">byCycle</a>
        </h1>
    </header>

    <Menu />

    <Map />

    <svelte:component this={$currentRoute.component} />
</div>

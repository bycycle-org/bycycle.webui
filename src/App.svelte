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

<style type="text/scss">
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

        width: $header-width;
        z-index: 1;

        > h1 {
            margin: 0;
            padding: 0;

            > a {
                color: $header-color;
                display: block;
                font-size: 18px;
                font-weight: normal;
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

    :global(.function) {
        form,
        #results,
        #error {
            position: absolute;
            right: 0;
            left: 0;
            min-width: $sm-width / 2;
            z-index: 2;

            margin: 0;
            padding: 0;

            background-color: white;
            box-shadow: 2px 2px 2px $link-color;

            @media (min-width: $sm-width) {
                right: auto;
                left: $standard-spacing;
                width: $panel-width - $twice-standard-spacing;
            }
        }

        form {
            button.material-icons[disabled] {
                border: none;
            }

            input {
                border: none;
                outline: 0;
                margin: 0;
                padding: 0;
                height: $button-width + $standard-spacing;
                font-size: 14px;
                min-width: 20px;
            }

            span {
                color: gray;
                font-size: 22px;
                line-height: 1;
                margin: $half-standard-spacing 0;
            }

            @media (min-width: $sm-width) {
                top: $standard-spacing;

                input {
                    font-size: 16px;
                    line-height: 22px;
                }
            }
        }

        #results,
        #error {
            overflow-y: auto;
        }

        #results, .results {
            list-style: none;
            margin: 0;
            padding: 0;

            > li {
                border-top: 1px solid #e0e0e0;
                margin: 0;
                padding: 0;

                &:hover {
                    background-color: #f8f8f8;
                }

                a {
                    color: $text-color;
                    text-decoration: none;
                }

                > * {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    padding: $standard-spacing $half-standard-spacing;
                }
            }
        }

        #error {
            color: darkred;
            border-top: 1px solid #e0e0e0;
            padding: $half-standard-spacing;

            .error-title {
                font-size: 20px;
                margin-bottom: $standard-spacing;
            }

            .error-message > * {
                margin-top: 0;
                margin-bottom: $standard-spacing;
                padding: 0;
                &:last-child {
                    margin-bottom: 0;
                }
            }
        }

        @media (min-width: $sm-width) {
            width: $panel-width - $twice-standard-spacing;
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

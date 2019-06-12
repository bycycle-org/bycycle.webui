<script>
    import { onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import Menu from './Menu.svelte';
    import { Directions } from './directions';
    import { Query } from './query';
    import { Map, MapService } from './map';
    import { DIRECTIONS, QUERY, currentFunction, progressCounter } from './stores';
    import { contextMenuStore } from './map/stores';

    const map = new MapService();
    let showLoading = true;

    onMount(() => {
        setTimeout(() => {
            showLoading = false;
            progressCounter.decrement();
        }, 1000);
    });

    function handleClick() {
        $contextMenuStore = { open: false, x: 0, y: 0 };
    }
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
        z-index: 100;
        background-color: rgba(255, 255, 255, 0.75);
        border: 1px solid white;
        border-radius: $border-radius;
        font-size: 24px;
        line-height: 1;
        padding: $standard-spacing;
        transform: translateX(-50%) translateY(-50%);
    }

    #progress-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: $half-standard-spacing;
        z-index: 1;
        animation: blinker 1.5s linear infinite;
        background-color: seagreen;
    }

    header {
        position: absolute;
        bottom: $standard-spacing;
        left: (2 * $standard-spacing) + 128px;
        width: $header-width;
        z-index: 100;

        > h1 {
            margin: 0;
            padding: 0;

            > a {
                color: $header-color;
                display: block;
                font-size: 24px;
                font-weight: normal;
                text-decoration: none;
                text-shadow: 1px 1px 2px;
            }
        }
    }

    :global(.function) {
        position: absolute;
        width: $panel-width;
        z-index: 2;

        form,
        #results,
        #error {
            position: absolute;
            left: $standard-spacing;
            width: $panel-width - $twice-standard-spacing;
            min-width: 200px - $twice-standard-spacing;

            margin: 0;
            padding: 0;

            background-color: white;
            box-shadow: 2px 2px 2px $link-color;
        }

        form {
            top: $standard-spacing;
            z-index: 1;

            button.material-icons[disabled] {
                border: none;
            }

            input {
                border: none;
                outline: 0;
                margin: 0;
                padding: 0;
                height: $button-width + $standard-spacing;
                font-size: 16px;
                line-height: 22px;
                min-width: 20px;
            }

            span {
                color: gray;
                font-size: 22px;
                line-height: 1;
                margin: $half-standard-spacing 0;
            }
        }

        #results,
        #error {
            z-index: 2;
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

        @media (max-width: $xs-width) {
            width: 100%;

            form,
            #results,
            #error {
                right: $half-standard-spacing;
                left: $half-standard-spacing;
                width: auto;
            }

            form {
                top: $half-standard-spacing;

                input {
                    font-size: 14px;
                }
            }
        }
    }

    @media (max-width: $sm-width) {
        header {
            bottom: $standard-spacing;
            left: $standard-spacing;

            > h1 {
                > a {
                    font-size: 18px;
                }
            }
        }
    }

    @media (max-width: $xs-width) {
        #progress-bar {
            height: $half-standard-spacing - 1px;
        }

        header {
            bottom: $half-standard-spacing;
            left: $half-standard-spacing;

            > h1 {
                > a {
                    font-size: 18px;
                }
            }
        }
    }
</style>

<div id="container" on:click={handleClick}>
    {#if showLoading}
        <div id="loading" transition:fade>
            <span>Loading...</span>
        </div>
    {/if}

    {#if $progressCounter}
        <div id="progress-bar" transition:fly={{ y: -5 }} />
    {/if}

    <header title="Get there by Cycle!">
        <h1>
            <a href="/">byCycle</a>
        </h1>
    </header>

    <Menu {map} />

    <Map {map} />

    {#if $currentFunction === QUERY}
        <Query {map} on:query="{() => console.log('event')}" />
    {:else if $currentFunction === DIRECTIONS}
        <Directions {map} />
    {/if}
</div>

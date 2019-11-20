<script>
    import { fromEvent } from 'rxjs';
    import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
    import { onDestroy, onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    import { INPUT_DEBOUNCE_TIME } from '../const';
    import { locationStore } from '../map/stores';
    import { switchToQuery } from '../stores';
    import { toFixed } from '../util';
    import { getDirections } from './directions';
    import {
        directionsFromTerm,
        directionsFromPoint,
        directionsToTerm,
        directionsToPoint,
        directionsResults,
        directionsError,
        setDirectionsState
    } from './stores';

    export let map;

    let fromInputElement;
    let toInputElement;
    let subscription;
    let highlightOverlay;

    onMount(() => {
        if (!$directionsFromTerm || $directionsToTerm) {
            fromInputElement.focus();
        } else {
            toInputElement.focus();
        }

        subscription = fromEvent([fromInputElement, toInputElement], 'input')
            .pipe(
                tap(event => {
                    if (event.target === fromInputElement) {
                        directionsFromPoint.set(null);
                    } else if (event.target === toInputElement) {
                        directionsToPoint.set(null);
                    }
                    directionsResults.set([]);
                    directionsError.set(null);
                    map.clearOverlays();
                    map.vectorLayer.getSource().clear();
                }),
                debounceTime(INPUT_DEBOUNCE_TIME),
                distinctUntilChanged()
            )
            .subscribe(event => {});

        if ($directionsFromTerm && $directionsToTerm) {
            handleSubmit();
        }
    });

    onDestroy(() => {
        subscription.unsubscribe();
        map.clearOverlays();
        map.vectorLayer.getSource().clear(true);
    });

    function handleSubmit() {
        const args = {
            fromTerm: $directionsFromTerm,
            fromPoint: $directionsFromPoint,
            toTerm: $directionsToTerm,
            toPoint: $directionsToPoint,
            myLocation: $locationStore
        };
        getDirections(args, map);
    }

    function swapFromAndTo () {
        setDirectionsState({
            fromTerm: $directionsToTerm,
            fromPoint: $directionsToPoint,
            toTerm: $directionsFromTerm,
            toPoint: $directionsFromPoint
        });
        handleSubmit();
    }

    function getIconForTurn (turn) {
        switch (turn) {
            case 'straight':
                return 'arrow_upward';
            case 'back':
                return 'arrow_downward';
            case 'left':
                return 'arrow_back';
            case 'right':
                return 'arrow_forward';
            case 'north':
            case 'east':
            case 'south':
            case 'west':
                return turn.charAt(0).toUpperCase();
            case 'northeast':
            case 'southeast':
            case 'southwest':
            case 'northwest':
                return `${turn.charAt(0)}${turn.charAt(5)}`.toUpperCase();
            default:
                return turn;
        }
    }

    function getArchaicDistance (distance) {
        return (
            distance.feet <= 300 ?
                `${toFixed(distance.feet)}ft` :
                `${toFixed(distance.miles)}mi`
        );
    }

    function getMetricDistance (distance) {
        return (
            distance.meters <= 100 ?
                `${toFixed(distance.meters)}m` :
                `${toFixed(distance.kilometers)}km`
        );
    }

    function getEstimatedTime (distance) {
        const minutes = 6 * distance.miles;
        if (minutes < 1) {
            return `${Math.round(minutes * 60)} seconds`;
        } else if (minutes < 60) {
            return `${Math.round(minutes)} minutes`;
        }
        // TODO: Convert to hours and minutes
        return `${minutes} minutes`;
    }

    function handleReset() {
        setDirectionsState();
        map.clearOverlays();
        switchToQuery();
    }

    function handleDirectionClick(direction) {
        map.setCenter(direction.point.coordinates);
        map.zoomToStreetLevel();
    }

    function handleDirectionHover(direction) {
        if (highlightOverlay) {
            map.clearOverlay(highlightOverlay);
        }
        highlightOverlay = map.addOverlay(
            direction.point.coordinates, 'map-marker-turn', 'center-center');
    }

    function handleDirectionHoverOut(direction) {
        if (highlightOverlay) {
            map.clearOverlay(highlightOverlay);
        }
    }
</script>

<style type="text/scss">
    @import 'styles/variables';

    form {
        display: flex;
        flex-direction: column;

        > div {
            display: flex;
            flex-direction: row;
            &:last-child {
                border-bottom: none;
            }
        }

        div.fields, div.swap-from-and-to {
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        div.fields {
            flex: 1;
            > div {
                margin: 0 $half-standard-spacing;
            }
            > div:first-child {
                border-bottom: 1px solid lightgray;
            }
            input {
                width: 100%;
            }
        }

        div.swap-from-and-to > button {
            margin-right: $half-standard-spacing;
        }

        div.buttons {
            display: flex;
            flex-direction: row;
            justify-content: flex-end;
            padding: $half-standard-spacing;
            button.material-icons {
                margin-right: $half-standard-spacing;
                &:last-child {
                    margin-right: 0;
                }
            }
        }
    }

    #results, #error {
        top: $standard-spacing + (3 * 40px);
    }

    li.start {
        background-color: rgba(0, 255, 0, 0.10);
        color: green;
    }

    li.end {
        background-color: rgba(255, 0, 0, 0.10);
        color: red;
    }

    .distance {
        flex: 1;
        text-align: right;
    }

    .info {
        padding: 8px;

        > p {
            font-size: 14px;
            font-style: italic;
            margin: 0 0 8px;
            &:last-child {
                margin-bottom: 0;
            }
        }
    }
</style>


<div class="function">
    <form on:submit|preventDefault="{handleSubmit}">
        <div class="buttons">
            <button type="submit"
                    title="Get directions"
                    class="material-icons"
                    disabled="{!($directionsFromTerm && $directionsToTerm)}"
                    >search</button>

            <button type="reset"
                    title="Clear and return to search"
                    class="material-icons"
                    on:click="{handleReset}"
                    >clear</button>
        </div>

        <div>
            <div class="fields">
                <div>
                    <input type="text"
                           title="From"
                           placeholder="From (type or select point on map)"
                           spellcheck="false"
                           bind:this="{fromInputElement}"
                           bind:value="{$directionsFromTerm}" />
                </div>

                <div>
                    <input type="text"
                           title="To"
                           placeholder="To (type or select point on map)"
                           spellcheck="false"
                           bind:this="{toInputElement}"
                           bind:value="{$directionsToTerm}" />
                </div>
            </div>

            <div class="swap-from-and-to">
                <button type="button"
                        title="Swap from and to"
                        class="material-icons"
                        disabled="{!($directionsFromTerm || $directionsToTerm)}"
                        on:click={swapFromAndTo}
                        >swap_calls</button>
            </div>
        </div>
    </form>

    {#if $directionsResults.length}
        <div id="results" transition:fly={{ y: 0 }}>
            {#each $directionsResults as { start, end, distance, directions }}
                <ul class="results">
                    <li>
                        <span>
                            <i>{getArchaicDistance(distance)} / ~{getEstimatedTime(distance)}</i>
                        </span>
                    </li>

                    <li class="start">
                        <a href="#show-point"
                           on:click|preventDefault="{() => handleDirectionClick(start)}"
                           on:mouseenter|preventDefault="{() => handleDirectionHover(start)}"
                           on:mouseleave|preventDefault="{() => handleDirectionHoverOut(start)}">
                            <span class="material-icons map-marker map-marker-start"></span>
                            <span><b>Start</b><br>{start.name}</span>
                        </a>
                    </li>

                    {#each directions as direction, i}
                        <li>
                            <a href="#show-point"
                               on:click|preventDefault="{() => handleDirectionClick(direction)}"
                               on:mouseenter|preventDefault="{() => handleDirectionHover(direction)}"
                               on:mouseleave|preventDefault="{() => handleDirectionHoverOut(direction)}">
                                {#if i === 0}
                                    <span>
                                        Go {direction.turn} on {direction.name}
                                        {#if direction.toward}
                                            <br><small>toward {direction.toward}</small>
                                        {/if}
                                    </span>
                                    <span class="distance">
                                        {getArchaicDistance(direction.distance)}
                                    </span>
                                {:else}
                                    <span class="material-icons">{getIconForTurn(direction.turn)}</span>
                                    {#if direction.turn === 'straight'}
                                        <span>Continue on {direction.name}</span>
                                    {:else}
                                        <span>Turn {direction.turn} onto {direction.name}</span>
                                    {/if}
                                    <span class="distance">{getArchaicDistance(direction.distance)}</span>
                                {/if}
                            </a>
                        </li>
                    {/each}

                    <li class="end">
                        <a href="#show-point"
                           on:click|preventDefault="{() => handleDirectionClick(end)}"
                           on:mouseenter|preventDefault="{() => handleDirectionHover(end)}"
                           on:mouseleave|preventDefault="{() => handleDirectionHoverOut(end)}">
                            <span class="material-icons map-marker map-marker-end"></span>
                            <span><b>End</b><br>{end.name}</span>
                        </a>
                    </li>
                </ul>
            {/each}

            <div class="info">
                <p>
                    <b>Disclaimer</b>: As you are riding, please keep in mind that you
                    don't have to follow the suggested route. It may not be safe at any
                    given point. If you see what looks like an unsafe or undesirable
                    stretch in the suggested route, you can walk, ride on the sidewalk,
                    or go a different way.
                </p>

                <p>
                    Users should independently verify all information presented here.
                    This service is provided AS IS with NO WARRANTY of any kind.
                </p>
            </div>
        </div>
    {:else if $directionsError}
        <div id="error" transition:fly="{{ y: 0 }}">
            <div class="error-title">{$directionsError.title}</div>
            <div class="error-message">
                <p>{$directionsError.explanation}</p>
                {#if $directionsError.detail}
                    <p>{$directionsError.detail}</p>
                {/if}
            </div>
        </div>
    {/if}
</div>

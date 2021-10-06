<svelte:options immutable={true} />

<script>
    import { fromEvent } from 'rxjs';
    import {
        debounceTime,
        distinctUntilChanged,
        map as mapOperator,
        skipWhile,
        tap
    } from 'rxjs/operators';
    import { getContext, onDestroy, onMount, tick } from 'svelte';
    import { fly } from 'svelte/transition';
    import { INPUT_DEBOUNCE_TIME } from '../const';
    import { replaceState, setCurrentRoute } from '../routes';
    import { abortRequest, currentLocation, currentUrl } from '../stores';
    import { waitForLocation } from '../map/util';
    import { breakpointSwitch, toFixed } from '../util';
    import { getDirections, updateMap } from './directions';

    const map = getContext('map');

    let fromInputElement;
    let toInputElement;
    let inputSubscription;
    let highlightOverlay;

    let state;
    setState();

    onMount(() => {
        if (!state.fromTerm || state.toTerm) {
            fromInputElement.focus();
        } else {
            toInputElement.focus();
        }

        inputSubscription = fromEvent([fromInputElement, toInputElement], 'input')
            .pipe(
                tap(event => {
                    const target = event.target;
                    const value = target.value;
                    const newState = { ...state };
                    abortRequest();
                    if (target === fromInputElement) {
                        newState.fromTerm = value;
                        newState.fromPoint = null;
                    } else if (target === toInputElement) {
                        newState.toTerm = value;
                        newState.toPoint = null;
                    }
                    clearMap();
                    setState(newState);
                }),
                mapOperator(event => event.target.value),
                skipWhile(value => !value.trim()),
                debounceTime(INPUT_DEBOUNCE_TIME),
                distinctUntilChanged()
            )
            .subscribe(value => {});

        currentUrl.subscribe('directions', ({ params }) => {
            if (history.state && history.state.state) {
                const historyState = history.state.state;
                clearMap();
                updateMap(map, historyState.results);
                setState(historyState);
            } else {
                if (params.fromTerm || params.toTerm) {
                    if (params.fromTerm === '?') {
                        if (state.fromTerm) {
                            params.fromTerm = state.fromTerm;
                            params.fromPoint = state.fromPoint;
                        } else {
                            params.fromTerm = 'My Location';
                            params.fromPoint = null;
                        }
                    }

                    if (params.toTerm === '?') {
                        if (state.toTerm) {
                            params.toTerm = state.toTerm;
                            params.toPoint = state.toPoint;
                        } else {
                            params.toTerm = 'My Location';
                            params.toPoint = null;
                        }
                    }
                    replaceState('directions', params);
                }

                setState(params);
                tick();

                if (state.fromTerm && state.toTerm) {
                    const fromMyLocation = state.fromTerm.toLowerCase() === 'my location';
                    const toMyLocation = state.toTerm.toLowerCase() === 'my location';
                    if (fromMyLocation || toMyLocation) {
                        waitForLocation(handleSubmit, true, false, true);
                    } else {
                        handleSubmit(false, true);
                    }
                } else {
                    clearMap();
                }
            }
        })
    });

    onDestroy(() => {
        abortRequest();
        inputSubscription.unsubscribe();
        clearMap();
        setState();
    });

    function setState(newState = {}) {
        let showResults = false;
        if (typeof newState.showResults === 'undefined' && newState.results) {
            showResults = newState.results.length && breakpointSwitch(breakpoint => {
                switch (breakpoint) {
                    case 'xs':
                    case 'sm':
                        return false;
                    default:
                        return true;
                }
            });
        }
        state = {
            fromTerm: '',
            fromPoint: null,
            toTerm: '',
            toPoint: null,
            results: [],
            showResults,
            error: null,
            ...newState
        };
    }

    function setShowResults (showResults) {
        setState({ ...state, showResults});
    }

    async function handleSubmit(blur = false) {
        const newState = await getDirections(state, map, $currentLocation);
        if (newState) {
            setState(newState);
            // tick();
            replaceState('directions', newState, { state: newState });
        }
        if (blur) {
            fromInputElement.blur();
            toInputElement.blur();
        }
    }

    function swapFromAndTo () {
        setCurrentRoute('directions', {
            fromTerm: state.toTerm,
            fromPoint: state.toPoint,
            toTerm: state.fromTerm,
            toPoint: state.fromPoint
        });
    }

    function clearMap() {
        map.clearOverlays();
        map.vectorLayer.getSource().clear(true);
    }

    function getIconForTurn (turn) {
        switch (turn) {
            case 'straight':
                return 'arrow_upward';
            case 'back':
                return 'arrow_downward';
            case 'right':
                return 'arrow_forward';
            case 'left':
                return 'arrow_back';

            case 'north':
            case 'south':
            case 'east':
            case 'west':
                return turn.charAt(0).toUpperCase();

            case 'northeast':
            case 'northwest':
            case 'southeast':
            case 'southwest':
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
        clearMap();
        setCurrentRoute('home');
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

<style lang="scss">
    @import '../styles/variables';

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
        $form-height: 40px * 3;
        top: $form-height;
        max-height: calc(100% - (3 * 40px));
        @media (min-width: $sm-width) {
            top: $standard-spacing + $form-height;
            max-height: calc(100% - 16px - (3 * 40px));
        }
    }

    ul.results {
        > li.direction > a {
            display: flex;
            align-items: center;
            > :first-child {
                margin-right: $half-standard-spacing;
            }
        }

        > li.start {
            background-color: rgba(0, 255, 0, 0.10);
            color: green;
        }

        > li.end {
            background-color: rgba(255, 0, 0, 0.10);
            color: red;
        }
    }

    .cardinal-direction {
        font-size: 24px;
        padding: 0 4px;
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
    <form on:submit|preventDefault="{() => handleSubmit(true)}">
        <div class="buttons">
            <button type="submit"
                    title="Get directions"
                    class="material-icons"
                    disabled="{!(state.fromTerm && state.toTerm)}"
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
                    <input type="search"
                           title="From"
                           placeholder="From (type or select point on map)"
                           autocapitalize="off"
                           autocomplete="off"
                           autocorrect="off"
                           spellcheck="false"
                           bind:this="{fromInputElement}"
                           bind:value="{state.fromTerm}" />
                </div>

                <div>
                    <input type="search"
                           title="To"
                           placeholder="To (type or select point on map)"
                           autocapitalize="off"
                           autocomplete="off"
                           autocorrect="off"
                           spellcheck="false"
                           bind:this="{toInputElement}"
                           bind:value="{state.toTerm}" />
                </div>
            </div>

            <div class="swap-from-and-to">
                <button type="button"
                        title="Swap from and to"
                        class="material-icons"
                        disabled="{!(state.fromTerm || state.toTerm)}"
                        on:click={swapFromAndTo}
                        >swap_calls</button>
            </div>
        </div>
    </form>

    {#if state.showResults}
        <div id="results" on:touchmove|stopPropagation in:fly={{ y: 0 }}>
            {#each state.results as { start, end, distance, directions }}
                <ul class="results">
                    <li>
                        <span>
                            <i>{getArchaicDistance(distance)} / ~{getEstimatedTime(distance)}</i>
                        </span>
                    </li>

                    <li class="direction start">
                        <a href="#show-point"
                           on:click|preventDefault="{() => handleDirectionClick(start)}"
                           on:mouseenter|preventDefault="{() => handleDirectionHover(start)}"
                           on:mouseleave|preventDefault="{() => handleDirectionHoverOut(start)}">
                            <span class="material-icons map-marker map-marker-start"></span>
                            <span><b>Start</b><br>{start.name}</span>
                        </a>
                    </li>

                    {#each directions as direction, i}
                        <li class="direction">
                            <a href="#show-point"
                               on:click|preventDefault="{() => handleDirectionClick(direction)}"
                               on:mouseenter|preventDefault="{() => handleDirectionHover(direction)}"
                               on:mouseleave|preventDefault="{() => handleDirectionHoverOut(direction)}">
                                {#if i === 0}
                                    <span class="cardinal-direction">{getIconForTurn(direction.turn)}</span>
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

                    <li class="direction end">
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
    {:else if state.error}
        <div id="error" in:fly="{{ y: 0 }}">
            <div class="error-title">{state.error.title}</div>
            <div class="error-message">
                <p>{state.error.explanation}</p>
                {#if state.error.detail}
                    <p>{state.error.detail}</p>
                {/if}
            </div>
        </div>
    {/if}
</div>

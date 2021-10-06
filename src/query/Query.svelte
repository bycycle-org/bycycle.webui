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
    import { pushState, setCurrentRoute } from '../routes';
    import { abortRequest, currentLocation, currentUrl } from '../stores';
    import { waitForLocation } from '../map/util';
    import { submitQuery } from './query';

    const map = getContext('map');

    let inputElement;
    let inputSubscription;

    let state;
    setState();

    onMount(() => {
        inputElement.focus();

        inputSubscription = fromEvent(inputElement, 'input')
            .pipe(
                mapOperator(event => event.target.value),
                tap(value => {
                    const newState = { term: value };
                    abortRequest();
                    if (value) {
                        newState.point = null;
                    }
                    clearMap();
                    setState(newState);
                }),
                skipWhile(value => !value.trim()),
                debounceTime(INPUT_DEBOUNCE_TIME),
                distinctUntilChanged()
            )
            .subscribe(value => {
                if (value) {
                    handleSubmit(true);
                }
            });

        currentUrl.subscribe('default', () => {
            setState({
                error: {
                    title: 'Page not found',
                    explanation: location.href,
                    detail: [
                        'Please check the web address and try again,',
                        'or send an email to contact@bycycle.org.'
                    ].join(' ')
                }
            });
        });

        currentUrl.subscribe('home', () => {
            clearMap();
            setState();
        });

        currentUrl.subscribe('search', ({ params }) => {
            if (history.state && history.state.result) {
                handleResultClick(history.state.result, false);
            } else {
                setState(params);
                tick();
                if (params.term) {
                    if (params.term.trim().toLowerCase() === 'my location') {
                        waitForLocation(handleSubmit, true, false, true);
                    } else {
                        handleSubmit(false, true);
                    }
                } else {
                    clearMap();
                }
            }
        });
    });

    onDestroy(() => {
        abortRequest();
        inputSubscription.unsubscribe();
        clearMap();
        setState();
    });

    function setState(newState = {}) {
        state = {
            term: '',
            point: null,
            results: [],
            error: null,
            ...newState
        };
    }

    async function handleSubmit(suppressErrors = false, blur = false) {
        const result = await submitQuery(state, map, $currentLocation, suppressErrors);
        if (result) {
            setState(result);
        }
        if (blur) {
            inputElement.blur();
        }
    }

    function clearMap() {
        map.clearOverlays();
    }

    function handleReset() {
        clearMap();
        setCurrentRoute('home');

        // Force input element to cycle (in case the user happens to
        // paste in the same value again).
        inputElement.value = '';
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function getDirections() {
        if (state.results.length === 1) {
            handleResultClick(state.results[0]);
            tick();
        }
        const fromTerm = $currentLocation.position ? 'My Location' : '';
        setCurrentRoute('directions', {
            fromTerm,
            fromPoint: null,
            toTerm: state.term,
            toPoint: state.point
        });
    }

    function handleResultClick(result, push = true) {
        const term = result.name;
        const point = result.coordinates;
        const resultState = { term, point };
        clearMap();
        map.addOverlay(point, 'map-marker-place');
        map.setCenter(point);
        map.zoomToStreetLevel();
        setState(resultState);
        if (push) {
            pushState('search', resultState, { ...resultState, result });
        }
    }
</script>

<style lang="scss">
    @import '../styles/variables';

    form {
        display: flex;
        flex-direction: row;
        align-items: center;

        button.material-icons {
            margin-right: $half-standard-spacing;
        }

        input {
            flex: 1;
            margin-left: $button-width + $standard-spacing;
        }
    }

    #results, #error {
        top: 40px;
        @media (min-width: $sm-width) {
            top: $standard-spacing + 40px;
        }
    }
</style>

<div class="function" style="height: {state.results.length ? '100%' : 'auto'}">
    <form on:submit|preventDefault={() => handleSubmit(false, true)}>
        <input type="search"
               title="{state.term || 'Enter something to search for'}"
               placeholder="Type or select point on map"
               autocapitalize="off"
               autocomplete="off"
               autocorrect="off"
               spellcheck="false"
               bind:this={inputElement}
               bind:value="{state.term}" />

        <button type="submit"
                title="Search"
                class="material-icons hidden-xs"
                disabled="{!state.term}"
                >search</button>

        <button type="reset"
                title="Clear"
                class="material-icons"
                disabled="{!(state.term || state.results.length || state.error)}"
                on:click={handleReset}
                >close</button>

        <button type="button"
                title="Get directions"
                class="material-icons"
                on:click={getDirections}
                >directions</button>
    </form>

    {#if state.results.length}
        <ul id="results" in:fly={{ y: 0 }}>
            {#each state.results as result}
                <li>
                    <a href="#select-result"
                       on:click|preventDefault="{() => handleResultClick(result)}">
                        <span class="material-icons">place</span>
                        <span>{result.name}</span>
                    </a>
                </li>
            {/each}
        </ul>
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

<script>
    import { fromEvent } from 'rxjs';
    import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
    import { onDestroy, onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    import { INPUT_DEBOUNCE_TIME } from '../const';
    import { locationStore } from '../map/stores';
    import { switchToDirections } from '../stores';
    import { submitQuery } from './query';
    import { queryTerm, queryPoint, queryResults, queryError, setQueryState } from './stores';

    export let map;

    let inputElement;
    let inputSubscription;
    let highlightOverlay;

    onMount(() => {
        inputElement.focus();
        inputSubscription = fromEvent(inputElement, 'input')
            .pipe(
                tap(event => {
                    if (!event.target.value) {
                        handleReset();
                    } else {
                        queryPoint.set(null);
                        queryResults.set([]);
                        queryError.set(null);
                        map.clearOverlays();
                    }
                }),
                debounceTime(INPUT_DEBOUNCE_TIME),
                distinctUntilChanged()
            )
            .subscribe(event => {
                handleSubmit(true);
            });
    });

    onDestroy(() => {
        inputSubscription.unsubscribe();
        map.clearOverlays();
    });

    function handleSubmit(suppressErrors = false) {
        const args = { term: $queryTerm, point: $queryPoint, myLocation: $locationStore };
        submitQuery(args, map, suppressErrors);
    }

    function handleReset() {
        setQueryState();
        map.clearOverlays();
    }

    function setFunction() {
        switchToDirections({
            fromTerm: 'My Location',
            toTerm: $queryTerm,
            toPoint: $queryPoint
        });
    }

    function handleResultClick(result) {
        const coordinates = result.coordinates;
        map.clearOverlays();
        map.addOverlay(coordinates);
        map.setCenter(coordinates);
        map.zoomToStreetLevel();
        setQueryState({
            term: result.name,
            point: coordinates
        });
    }

    function handleResultHover(result) {
        if (highlightOverlay) {
            map.clearOverlay(highlightOverlay);
        }
        highlightOverlay = map.addOverlay(result.coordinates);
    }

    function handleResultHoverOut(result) {
        if (highlightOverlay) {
            map.clearOverlay(highlightOverlay);
        }
    }
</script>

<style type="text/scss">
    @import './styles/variables';

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
        top: $standard-spacing + 40px;
    }

    @media (max-width: $xs-width) {
        form {
            input {
                margin-left: $button-width;
            }
        }

        #results {
            top: $half-standard-spacing + 40px;
        }
    }
</style>

<div class="function">
    <form on:submit|preventDefault={handleSubmit}>
        <input type="text"
               title="Enter something to search for"
               placeholder="Type or select point on map"
               spellcheck="false"
               bind:this={inputElement}
               bind:value="{$queryTerm}" />

        <button type="submit"
                title="Search"
                class="material-icons"
                disabled="{!$queryTerm}"
                >search</button>

        <button type="reset"
                title="Clear"
                class="material-icons hidden-xs"
                disabled="{!$queryTerm}"
                on:click={handleReset}
                >close</button>

        <button type="button" title="Get directions" class="material-icons" on:click={setFunction}>
            directions
        </button>
    </form>

    {#if $queryResults.length}
        <ul id="results" transition:fly={{ y: 0 }}>
            {#each $queryResults as result}
                <li>
                    <a href="#select-result"
                       on:click|preventDefault="{() => handleResultClick(result)}"
                       on:mouseenter="{() => handleResultHover(result)}"
                       on:mouseleave="{() => handleResultHoverOut(result)}">
                        <span class="material-icons">place</span>
                        <span>{result.name}</span>
                    </a>
                </li>
            {/each}
        </ul>
    {:else if $queryError}
        <div id="error" transition:fly="{{ y: 0 }}">
            <div class="error-title">{$queryError.title}</div>
            <div class="error-message">
                <p>{$queryError.explanation}</p>
                {#if $queryError.detail}
                    <p>{$queryError.detail}</p>
                {/if}
            </div>
        </div>
    {/if}
</div>

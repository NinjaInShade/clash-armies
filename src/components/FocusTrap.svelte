<script lang="ts" context="module">
	export const FOCUSABLE = ['a[href]', 'button', 'input', 'select', 'textarea', '[contenteditable]', '[tabindex]'].map(
		(selector) => `${selector}:not(:disabled):not([hidden]):not([tabindex^="-"])`
	);
</script>

<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	type Props = {
		/** Whether focus is returned after the trap is deactivated / destroyed */
		returnFocus?: boolean;
		/** The container which the focus will be trapped in */
		children: Snippet;
	};
	let { returnFocus = true, children }: Props = $props();

	let trapContainer: HTMLElement | null = $state(null);

	/** List of all focusable elements within the focus trap */
	let focusableEls: HTMLElement[];
	/** The element (if any) that had focus before we trapped focus */
	let originallyFocusedEl: HTMLElement | null = null;

	let observer: MutationObserver | null = null;

	onMount(() => {
		observer = new MutationObserver(onDOMChange);

		originallyFocusedEl = (document.activeElement ?? null) as HTMLElement | null;
		focusableEls = getFocusableEls();

		if (!focusableEls.length || !trapContainer) return;

		// Focus first element in the trap
		focusableEls[0].focus();

		observer.observe(trapContainer, { attributes: true, childList: true, subtree: true });

		return dispose;
	});

	function dispose() {
		if (observer) {
			observer.disconnect();
		}
		if (originallyFocusedEl && returnFocus) {
			originallyFocusedEl.focus();
		}
	}

	/**
	 * Stops the focus trap, returning focus to the originally focused element (if any). Only if `returnFocus` is not disabled
	 */
	export function deactivate() {
		return dispose();
	}

	function getFocusableEls() {
		if (!trapContainer) {
			return [];
		}
		return [...trapContainer.querySelectorAll(FOCUSABLE.join(', '))] as HTMLElement[];
	}

	function onDOMChange() {
		focusableEls = getFocusableEls();
	}

	function onKeyDown(e: KeyboardEvent) {
		const key = e.key;
		const shift = e.shiftKey;

		if (e.key === 'Escape') {
			dispose();
			return;
		}

		if (key !== 'Tab') {
			return;
		}

		e.preventDefault();

		const currentFocusedIndex = focusableEls.findIndex((el) => el === document.activeElement);

		if (shift) {
			if (currentFocusedIndex === 0) {
				// First item, loop to end and focus last element
				focusableEls[focusableEls.length - 1].focus();
			} else {
				// Focus previous element
				focusableEls[currentFocusedIndex - 1].focus();
			}
		} else {
			if (currentFocusedIndex === focusableEls.length - 1) {
				// Last item, loop back round and focus first element
				focusableEls[0].focus();
			} else {
				// Focus next element
				focusableEls[currentFocusedIndex + 1].focus();
			}
		}
	}
</script>

<svelte:window onkeydown={onKeyDown} />

<div bind:this={trapContainer}>
	{@render children()}
</div>

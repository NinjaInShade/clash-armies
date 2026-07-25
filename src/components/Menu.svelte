<script lang="ts">
	import { type Snippet, onDestroy } from 'svelte';
	import { computePosition, autoUpdate, flip, shift, offset, type Placement } from '@floating-ui/dom';

	type Props = {
		open: boolean;
		elRef: HTMLElement | undefined;
		fixed?: boolean;
		placement?: Placement;
		placementOffset?: number;
		/** Forces the menu's width to match the ref element's width, instead of shrinking to fit its content */
		matchWidth?: boolean;
		onClose?: () => void;
		children: Snippet;
	};
	let {
		open = $bindable(),
		elRef,
		fixed = false,
		children,
		placement = 'bottom',
		placementOffset = 2,
		matchWidth = false,
		onClose = () => {},
	}: Props = $props();

	// This shouldn't be state as $effect will infinitely re-run otherwise
	let autoUpdateDispose = () => {};

	let menuRef = $state<HTMLElement | undefined>();
	let x = $state<number | null>(null);
	let y = $state<number | null>(null);
	let width = $state<number | null>(null);

	onDestroy(unregisterAutoUpdate);

	$effect(() => void updateOpen(open));
	$effect(() => registerAutoUpdate(elRef, menuRef, open));

	function registerAutoUpdate(el: HTMLElement | undefined, menu: HTMLElement | undefined, open: boolean) {
		if (!el || !menu || !open) return;
		unregisterAutoUpdate();
		autoUpdateDispose = autoUpdate(el, menu, async () => await updatePos(el, menu));
	}

	function unregisterAutoUpdate() {
		if (!autoUpdateDispose) return;
		autoUpdateDispose();
	}

	async function updatePos(el: HTMLElement | undefined, menu: HTMLElement | undefined) {
		if (!el || !menu) return;
		const middleware = [offset(placementOffset), flip(), shift({ padding: 16 })];
		const pos = await computePosition(el, menu, { placement, middleware });
		x = pos.x;
		y = pos.y;
		width = matchWidth ? el.getBoundingClientRect().width : null;
	}

	async function updateOpen(shouldOpen: boolean) {
		if (shouldOpen) {
			await updatePos(elRef, menuRef);
			open = true;
		} else if (open) {
			open = false;
			onClose();
		}
	}

	function handleClickOutside(ev: MouseEvent) {
		const target = ev.target as Node | undefined;
		if (!open || !target || menuRef?.contains(target) || elRef?.contains(target)) {
			return;
		}
		updateOpen(false);
	}

	function handleFocusOutside(ev: FocusEvent) {
		const target = ev.relatedTarget as Node | undefined;
		if (!open || !target || menuRef?.contains(target) || elRef?.contains(target)) {
			return;
		}
		updateOpen(false);
	}

	function handleEscape(ev: KeyboardEvent) {
		if (open && ev.key === 'Escape') {
			updateOpen(false);
		}
	}

	function handleScroll() {
		updateOpen(false);
	}

	function handleMenuClick(ev: MouseEvent) {
		// Don't swallow clicks on links, otherwise they never reach SvelteKit's
		// top-level HTML click handler and fall back to full-page reloads.
		if (!(ev.target as Element).closest('a')) {
			ev.stopPropagation();
		}
	}
</script>

<svelte:window onfocusout={handleFocusOutside} onclick={handleClickOutside} onkeydown={handleEscape} onscroll={handleScroll} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="menu focus-grey"
	class:fixed
	class:hidden={!open || x === null || y === null}
	style="--x: {x}px; --y: {y}px; {width !== null ? `width: ${width}px; max-width: ${width}px;` : ''}"
	onclick={handleMenuClick}
	bind:this={menuRef}
>
	<!--
	    Guarded on x/y too, not just open - on a given instance's first-ever open these start `null`
	    since the position isn't known until `computePosition` resolves, so mounting on `open` alone briefly
	    renders children while this div is still `display: none`, breaking any layout measurement they may do on mount
	 -->
	{#if open && x !== null && y !== null}
		{@render children()}
	{/if}
</div>

<style>
	.menu {
		position: absolute;
		left: var(--x);
		top: var(--y);
		max-width: var(--menu-width, max-content);
		max-height: var(--menu-height, max-content);
		width: 100%;
		height: 100%;
		z-index: 1;

		&.fixed {
			position: fixed;
		}
	}
	.menu.hidden {
		display: none;
	}
</style>

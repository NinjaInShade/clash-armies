<script lang="ts">
	import { type Snippet, onDestroy } from 'svelte';
	import { computePosition, autoUpdate, flip, shift, offset, type Placement } from '@floating-ui/dom';

	type Props = {
		open: boolean;
		elRef: HTMLElement | undefined;
		placement?: Placement;
		onClose?: () => void;
		children: Snippet;
	};
	let { open = $bindable(), elRef, children, placement = 'bottom', onClose = () => {} }: Props = $props();

	// This shouldn't be state as $effect will infinitely re-run otherwise
	let autoUpdateDispose = () => {};

	let menuRef = $state<HTMLElement | undefined>();
	let x = $state<number | null>(null);
	let y = $state<number | null>(null);

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
		const middleware = [offset(2), flip(), shift({ padding: 16 })];
		const pos = await computePosition(el, menu, { placement, middleware });
		x = pos.x;
		y = pos.y;
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
</script>

<svelte:window onfocusout={handleFocusOutside} onclick={handleClickOutside} onkeydown={handleEscape} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="menu focus-grey"
	class:hidden={!open || x === null || y === null}
	style="--x: {x}px; --y: {y}px;"
	onclick={(ev) => ev.stopPropagation()}
	bind:this={menuRef}
>
	{#if open}
		{@render children()}
	{/if}
</div>

<style>
	.menu {
		position: absolute;
		width: max-content;
		left: var(--x);
		top: var(--y);
		z-index: 1;
	}
	.menu.hidden {
		display: none;
	}
</style>

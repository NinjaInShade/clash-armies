<script lang="ts">
	import { type Snippet } from 'svelte';

	type Props = {
		open: boolean;
		refEl: HTMLElement | undefined;
		children: Snippet;
		/** The ideal position for the menu @default center */
		idealPlacement?: 'left' | 'center' | 'right';
	};
	let { open = $bindable(), refEl, children, idealPlacement = 'center' }: Props = $props();

	let menuEl = $state<HTMLElement | undefined>();
	let x = $state<number | null>(null);
	let y = $state<number | null>(null);

	$effect(() => {
		if (refEl) {
			refEl.addEventListener('click', toggleOpen);
		}
	});

	$effect(() => {
		if (open && refEl && menuEl) {
			updatePosition();
		}
	});

	function toggleOpen() {
		open = !open;
	}

	function updatePosition() {
		if (!open || !refEl || !menuEl) return;

		const refBBox = refEl.getBoundingClientRect();
		const menuBBox = menuEl.getBoundingClientRect();

		let newX = 0;
		let newY = refBBox.y + refBBox.height + 2;

		const leftPlacement = refBBox.x;
		const centerPlacement = refBBox.x + refBBox.width / 2 - menuBBox.width / 2;
		const rightPlacement = refBBox.x + refBBox.width - menuBBox.width;

		if (idealPlacement === 'left') {
			newX = leftPlacement;
			if (newX + menuBBox.width > document.body.clientWidth) {
				// No space to left, try right
				newX = rightPlacement;
			}
		} else if (idealPlacement === 'center') {
			newX = centerPlacement;
		} else if (idealPlacement === 'right') {
			newX = rightPlacement;
			if (newX < 0) {
				// No space to right, try left
				newX = leftPlacement;
			}
		} else {
			throw new Error(`Invalid placement "${idealPlacement}"`);
		}

		x = newX;
		y = newY;
	}

	function handleClickOutside(ev: MouseEvent) {
		if (!ev.target) return;
		if ((menuEl && menuEl.contains(ev.target)) || (refEl && refEl.contains(ev.target))) {
			return;
		}
		open = false;
	}
</script>

<svelte:window
	onfocusout={(ev) => {
		if (!ev.relatedTarget || (menuEl && menuEl.contains(ev.relatedTarget))) {
			return;
		}
		open = false;
	}}
	onclick={handleClickOutside}
	onresize={updatePosition}
	onscroll={updatePosition}
/>

<svelte:body onscroll={updatePosition} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="menu focus-grey"
	class:hidden={!open || x === null || y === null}
	style="--x: {x}px; --y: {y}px;"
	onclick={(ev) => {
		ev.stopPropagation();
	}}
	onkeydown={(ev) => {
		ev.stopPropagation();
	}}
	bind:this={menuEl}
>
	{@render children()}
</div>

<style>
	.menu {
		max-width: calc(100dvw - (16px * 2));
		transition: visibility 0s;
		visibility: visible;
		pointer-events: all;
		position: fixed;
		z-index: 1;
		left: var(--x);
		top: var(--y);
	}
	.menu.hidden {
		visibility: hidden;
		pointer-events: none;
	}
</style>

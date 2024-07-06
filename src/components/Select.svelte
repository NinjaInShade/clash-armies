<script context="module" lang="ts">
	type CloseFunction = () => void;
	const selectInstances: [HTMLElement, CloseFunction][] = [];
</script>

<script lang="ts">
	import type { SvelteComponentGeneric } from '~/lib/shared/types';

	type SelectData = { value: any; label: string; component?: [SvelteComponentGeneric, Record<string, any>] };

	import { onMount, getContext } from 'svelte';

	type Props = {
		/** Sets the bound value */
		value?: any | any[];
		/** Data that can be selected */
		data: SelectData[];
		/** Function that runs when you select an item */
		onSelect?: (newValue: any) => Promise<void> | void;
		/** Sets the disabled state */
		disabled?: boolean;
		/** Sets the tooltip */
		title?: string;
		/** Sets the class */
		class?: string;
		/** Sets the style */
		style?: string;
	};
	let { value = $bindable(), data, onSelect, disabled, title, class: _class, style }: Props = $props();

	// Passed down from context in parent <Fieldset />
	const htmlName = getContext<string>('htmlName');

	let open = $state<boolean>(false);
	let selectContainer = $state<HTMLElement>();
	let selectButton = $state<HTMLElement>();

	onMount(() => {
		selectInstances.push([selectContainer, () => (open = false)]);
	});

	// Calculate label
	let label = $derived(data.find((item) => item.value === value)?.label);
	let component = $derived(data.find((item) => item.value === value)?.component);

	// Calculates if an item is active
	const isActive = (itemValue: any) => {
		return itemValue === value;
	};

	const handleOpen = () => {
		if (!open) {
			// Closes all other select menu's, thus showing only one at a time
			selectInstances.forEach(([el, close]) => {
				if (el === selectContainer) {
					return;
				}

				close();
			});
			open = true;
		} else {
			open = false;
		}
	};

	// Closes if you click outside of the select
	const handleOutsideClick = (e: MouseEvent) => {
		if (!open || !selectButton) {
			return;
		}
		if (selectButton.contains(e.target)) {
			return;
		}
		open = false;
	};

	const handleSelect = async (ev: MouseEvent | KeyboardEvent, newValue: any) => {
		ev.stopPropagation();
		if (!newValue) {
			value = null;
		} else {
			value = newValue;
		}
		if (onSelect) {
			await onSelect(newValue);
		}
		open = false;
	};
</script>

<svelte:body onclick={handleOutsideClick} />

<div class="outer-container">
	<div class="inner-container" bind:this={selectContainer}>
		<input hidden {value} name={htmlName} id={htmlName} />

		<!-- Select button -->
		<button
			type="button"
			class="select {_class || ''}"
			class:open
			{disabled}
			{title}
			{style}
			name={htmlName}
			id={htmlName}
			onclick={handleOpen}
			bind:this={selectButton}
		>
			<span class="select-label">
				{#if label}
					{label}
				{:else if component}
					<svelte:component this={component[0]} {...component[1]} />
				{/if}
			</span>
			<div class="dropdown-icon-container">
				<svg width="12" height="6" viewBox="0 0 22 11" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M0 0L11 11L22 0H0Z" fill="var(--grey-100)" />
				</svg>
			</div>
		</button>
		<!-- Select menu -->
		<ul class="select-menu" class:open>
			<!-- Forces re-evaluation of active item (might need to re-think approach for larger datasets) -->
			{#each data as item}
				<li>
					<button
						type="button"
						class="select-menu-item"
						class:active={isActive(item.value)}
						onclick={(ev) => handleSelect(ev, item.value)}
						tabindex={open ? 0 : -1}
					>
						{#if item.label}
							{item.label}
						{:else if item.component}
							<svelte:component this={item.component[0]} {...item.component[1]} />
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	</div>
</div>

<style>
	.outer-container {
		position: relative;
		max-width: var(--input-width, 250px);
		width: 100%;
		height: 100%;
	}

	.inner-container {
		position: relative;
		height: 100%;
		width: 100%;
	}

	.select {
		display: flex;
		justify-content: space-between;
		align-items: stretch;
		position: relative;
		border-radius: 6px;
		font-size: var(--fs);
		line-height: var(--fs-lh);
		background-color: var(--grey-700);
		border: 1px solid var(--grey-500);
		color: var(--grey-100);
		width: 100%;
		height: 100%;
		gap: 8px;
	}

	.select.open {
		transition: all 0s;
		border-radius: 6px 6px 0 0;
	}

	.select:focus,
	.select:active {
		outline: none;
		border: 1px solid var(--primary-400);
		box-shadow: 0 0 10px 0 hsla(33, 78%, 57%, 0.2);
	}

	.select:disabled {
		user-select: none;
		cursor: not-allowed;
		opacity: 0.5;
	}

	.select-label {
		color: var(--grey-100);
		font-weight: 500;
		padding: 7px 16px;
		flex: 1 0 0px;
	}

	.dropdown-icon-container {
		display: flex;
		align-items: center;
		background-color: var(--grey-850);
		border-radius: 0 6px 6px 0;
		padding: 0 0.4em;
	}
	.select.open .dropdown-icon-container {
		border-bottom-right-radius: 0px;
	}

	/* Menu */
	.select-menu {
		z-index: 2;
		display: none;
		position: absolute;
		border: 1px solid var(--grey-500);
		overflow: hidden;
		min-width: 100%;
		top: 100%;
		left: 0;
	}

	.select-menu.open {
		display: block;
	}

	.select-menu-item {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		transition: all 0.05s ease-in-out;
		font-size: var(--fs);
		line-height: var(--fs);
		background-color: var(--grey-700);
		height: var(--input-height, 42px);
		color: var(--grey-100);
		font-weight: 500;
		padding: 6px 16px;
		width: 100%;
	}

	.select-menu-item:hover {
		background-color: var(--grey-850);
	}

	.select-menu li:not(:last-child) .select-menu-item {
		border-bottom: 1px solid var(--grey-500);
	}

	.select-menu-item.active,
	.select-menu-item.active:hover {
		color: var(--primary-400);
	}

	.select-menu-item:focus {
		outline: none;
		border: 1px solid var(--primary-400);
		box-shadow: 0 0 10px 0 hsla(33, 78%, 57%, 0.2);
	}

	.select-menu li:not(:last-child) .select-menu-item:focus {
		border-bottom: 1px solid var(--primary-400);
	}
</style>

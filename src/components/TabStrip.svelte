<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount, type Component } from 'svelte';

	type Tab = {
		name: string;
		component: Component;
		componentProps?: Record<string, unknown>;
		label?: string;
	};
	type Props = {
		tabs: Tab[];
		class?: string;
	};
	const { tabs, class: _class }: Props = $props();

	let currentTab = $state<Tab | null>(null);

	onMount(async function () {
		await loadTab();
	});

	$effect(() => {
		// If tabs change (such as component props changing), update state
		void loadTab();
	});

	async function loadTab() {
		const tab = page.url.searchParams.get('tab');
		if (!tab) {
			const defaultTab = tabs[0];
			await setTabQuery(defaultTab.name);
		} else {
			const foundTab = tabs.find((t) => t.name === tab);
			if (!foundTab) return;
			currentTab = foundTab;
		}
	}

	async function changeTab(tab: Tab) {
		currentTab = tab;
		await setTabQuery(tab.name);
	}

	async function setTabQuery(tab: string) {
		page.url.searchParams.set('tab', tab);
		await goto(`?${page.url.searchParams.toString()}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true,
		});
	}
</script>

<div class="tabs {_class || ''}">
	{#each tabs as tab, index}
		<button
			class="tab"
			class:active={currentTab?.name === tab.name}
			onclick={async () => {
				await changeTab(tab);
			}}
		>
			{tab.label ?? tab.name}
		</button>
	{/each}
</div>

{#if currentTab}
	<currentTab.component {...currentTab.componentProps ?? {}} />
{/if}

<style>
	.tabs {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		border-bottom: 2px solid var(--grey-500);
		margin-bottom: 2em;
		width: 100%;
	}

	.tab {
		position: relative;
		padding: 0.5em 1.5em;
		color: var(--grey-400);
		font-weight: 500;
	}
	.tab.active,
	.tab:hover,
	.tab:focus-visible {
		color: var(--grey-100);
	}
	.tab:focus-visible {
		outline: none;
	}
	.tab.active::after {
		position: absolute;
		content: '';
		bottom: -2px;
		width: 100%;
		height: 2px;
		left: 0;
		background-color: var(--primary-400);
	}
</style>

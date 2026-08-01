<script lang="ts">
	import { mkParamStore } from '~/lib/client/params.svelte';
	import type { Component } from 'svelte';

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

	// Falls back to the first tab both when there's no `tab` param yet or there is but is an unknown tab.
	const tabStore = mkParamStore('tab', 'string');
	const currentTab = $derived(tabs.find((t) => t.name === tabStore.value) ?? tabs[0]);

	async function changeTab(tab: Tab) {
		tabStore.value = tab.name;
	}
</script>

<div class="tabs {_class || ''}">
	{#each tabs as tab (tab.name)}
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

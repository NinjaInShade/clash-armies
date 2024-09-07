<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { SvelteComponentGeneric } from '$types';

	type Tab = {
		name: string;
		component: SvelteComponentGeneric;
		componentProps?: Record<string, unknown>;
		label?: string;
	};
	type Props = {
		tabs: Tab[];
		class?: string;
	};
	const { tabs, class: _class }: Props = $props();

	let currentTab = $state<Tab | null>(null);

	onMount(function () {
		loadTab();
	});

	$effect(() => {
		// If tabs change (such as component props changing), update state
		loadTab();
	});

	function loadTab() {
		const tab = $page.url.searchParams.get('tab');
		if (!tab) {
			const defaultTab = tabs[0];
			setTabQuery(defaultTab.name);
		} else {
			const foundTab = tabs.find((t) => t.name === tab);
			if (!foundTab) return;
			currentTab = foundTab;
		}
	}

	function changeTab(tab: Tab) {
		currentTab = tab;
		setTabQuery(tab.name);
	}

	function setTabQuery(tab: string) {
		$page.url.searchParams.set('tab', tab);
		goto(`?${$page.url.searchParams.toString()}`);
	}
</script>

<div class="tabs {_class || ''}">
	{#each tabs as tab, index}
		<button
			class="tab"
			class:active={currentTab?.name === tab.name}
			onclick={() => {
				changeTab(tab);
			}}
		>
			{tab.label ?? tab.name}
		</button>
	{/each}
</div>

{#if currentTab}
	<svelte:component this={currentTab.component} {...currentTab.componentProps ?? {}} />
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
	.tab:focus {
		color: var(--grey-100);
	}
	.tab:focus {
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

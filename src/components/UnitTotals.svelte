<script lang="ts">
	import type { UnitHome } from '$types';
	import type { ArmyModel } from '$models';

	type Props = {
		model: ArmyModel;
		housedIn: UnitHome;
	};

	const { model, housedIn }: Props = $props();
	const used = $derived(housedIn === 'armyCamp' ? model.housingSpaceUsed : model.ccHousingSpaceUsed);
	const capacity = $derived(housedIn === 'armyCamp' ? model.capacity : model.ccCapacity);
</script>

<div class="totals">
	<small class="total">
		<img src="/ui/troops.webp" alt="Clash of clans troop capacity" />
		{used.troops}/{capacity.troops}
	</small>
	{#if capacity.spells > 0}
		<small class="total">
			<img src="/ui/spells.webp" alt="Clash of clans spell capacity" />
			{used.spells}/{capacity.spells}
		</small>
	{/if}
	{#if capacity.sieges > 0}
		<small class="total">
			<img src="/ui/sieges.webp" alt="Clash of clans siege machine capacity" />
			{used.sieges}/{capacity.sieges}
		</small>
	{/if}
</div>

<style>
	.totals {
		display: flex;
		align-items: center;
		background-color: var(--grey-800);
		border-radius: 4px;
		padding: 6px 8px;
		gap: 12px;
	}
	.totals small {
		display: flex;
		align-items: center;
		font-family: 'Clash', sans-serif;
		color: var(--grey-100);
		font-size: 15px;
		min-width: 4ch;
		white-space: nowrap;
		gap: 4px;
	}
	.totals img {
		display: block;
		max-height: 22px;
		height: 100%;
		width: auto;
	}
</style>

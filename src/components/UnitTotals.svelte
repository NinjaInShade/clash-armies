<script lang="ts">
	import { formatTime } from '$client/army';
	import type { Totals } from '$types';

	type Props = {
		used: Totals;
		capacity: Omit<Totals, 'time'>;
		/** @default true */
		showTime?: boolean;
		class?: string;
	};

	const { used, capacity, showTime = true, class: _class }: Props = $props();
</script>

<div class="totals {_class ?? ''}">
	<small class="total">
		<img src="/clash/ui/troops.png" alt="Clash of clans troop capacity" />
		{used.troops}/{capacity.troops}
	</small>
	{#if capacity.spells > 0}
		<small class="total">
			<img src="/clash/ui/spells.png" alt="Clash of clans spell capacity" />
			{used.spells}/{capacity.spells}
		</small>
	{/if}
	{#if capacity.sieges > 0}
		<small class="total">
			<img src="/clash/ui/sieges.png" alt="Clash of clans siege machine capacity" />
			{used.sieges}/{capacity.sieges}
		</small>
	{/if}
	{#if showTime}
		<small class="total">
			<img src="/clash/ui/clock.png" alt="Clash of clans clock (time to train army)" />
			{formatTime(used.time * 1000)}
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

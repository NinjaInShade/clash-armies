<script lang="ts">
	import type { ArmyModel } from '$models';
	import { getTags } from '$lib/client/army';

	type Props = {
		model: ArmyModel;
		tagStyle?: string;
	};
	const { model, tagStyle }: Props = $props();
</script>

<ul class="tags">
	{#each getTags(model) as tag}
		<li style={tagStyle}>
			{#if tag.icon}
				<tag.icon></tag.icon>
			{/if}
			{tag.label}
		</li>
	{/each}
</ul>

<style>
	.tags {
		display: flex;
		flex-flow: row wrap;
		gap: 4px;

		& li {
			display: flex;
			align-items: center;
			text-transform: uppercase;
			white-space: nowrap;
			background-color: #4c4538;
			color: #e0a553;
			font-size: 12px;
			line-height: 14px;
			font-weight: 700;
			border-radius: 4px;
			padding: 4px 6px;
			gap: 4px;

			& :global(svg) {
				display: block;
				flex-shrink: 0;
			}
		}
	}
</style>

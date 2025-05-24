<script lang="ts">
	type Props = {
		level: number;
		height?: number;
		displayLevel?: boolean;
	};
	let { level, height, displayLevel }: Props = $props();
</script>

<img src="/clash/town-halls/{level}.png" alt="Town hall {level}" style="--height: {height ?? 38}px" />

{#if displayLevel}
	<p>TH{level}</p>
{/if}

<style>
	img {
		display: block;
		height: var(--height);
		width: auto;
	}

	p {
		display: block;
		font-weight: 500;
		margin-left: 4px;
	}
</style>

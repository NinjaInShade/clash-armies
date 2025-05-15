<script lang="ts">
	const changelog = processMarkdown();

	/**
	 * Super basic markdown processor so that CHANGELOG can be styled nice
	 */
	function processMarkdown() {
		const split = __CHANGELOG__.split('\n');
		const mapped = split.map((line) => {
			if (line.startsWith('##')) {
				return `<h2>${line.substring(2).trimStart()}</h2>`;
			}
			return `<p>${line}</p>`;
		});
		return mapped.join('\n');
	}
</script>

<svelte:head>
	<title>ClashArmies • Changelog • See latest updates</title>
	<meta
		name="description"
		content="Stay up to date with the latest improvements to the best Clash of Clans army finder & builder tool. New features, fixes, and upgrades — all in one place."
	/>
	<link rel="canonical" href="https://clasharmies.com/changelog" />
</svelte:head>

<section>
	<div class="container">
		{@html changelog}
	</div>
</section>

<style>
	section {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 50px var(--side-padding);
		flex: 1 0 0px;
	}
	section .container {
		background-color: var(--grey-800);
		color: var(--grey-100);
		border-radius: 8px;
		padding: 2em;
		height: 100%;
	}
	section .container :global(h2) {
		margin-bottom: 0.35em;
	}
	section .container :global(h2:not(:first-child)) {
		margin-top: 1.5em;
	}
	section .container :global(p) {
		font-family: 'monospace';
		color: var(--grey-300);
	}
</style>

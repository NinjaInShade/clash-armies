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
	<title>ClashArmies • Changelog</title>
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

	img {
		margin: 0 auto;
		display: block;
		max-width: 350px;
		height: auto;
	}

	section h1 {
		text-align: center;
		margin: 0.5em 0 0.25em 0;
	}

	p {
		margin: 0 auto;
		max-width: 350px;
		text-align: center;
		color: var(--grey-400);
	}

	a {
		color: var(--primary-400);
		font-weight: 500;
	}
</style>

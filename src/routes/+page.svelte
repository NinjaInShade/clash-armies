<script lang="ts">
	import Link from '~/components/Link.svelte';
</script>

<svelte:head>
	<title>ClashArmies • Home</title>
</svelte:head>

<header>
	<div class="container">
		<h1>Find the best<br />armies <span>EVER!</span></h1>
		<p class="body">The number one tool to find, create, learn and share the best armies in the game</p>
		<Link href="/armies">Find armies</Link>

		<img class="graphic" src="/header-barbarian.png" alt="Angry clash of clans barbarian" />
	</div>
</header>

<style>
	header {
		background: repeat-x 0 25% url('/stones-background.png');
		padding: 0 var(--side-padding);
	}

	header .container {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		position: relative;
		padding: 150px 0 200px 0;
	}

	header .body {
		margin: 24px 0 32px 0;
		max-width: 365px;
	}

	header .graphic {
		position: absolute;
		right: -215px;
		bottom: 0;
	}
</style>

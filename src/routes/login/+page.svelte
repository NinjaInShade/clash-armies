<script lang="ts">
	import GoogleLoginButton from '$components/GoogleLoginButton.svelte';
</script>

<svelte:head>
	<title>ClashArmies • Login • Save & Create Clash of Clans Armies</title>
	<meta
		name="description"
		content="Log in to create powerful Clash of Clans armies, vote on top strategies, save your favorites, and view your Clash profile stats. Join the community!"
	/>
	<link rel="canonical" href="https://clasharmies.com/login" />
</svelte:head>

<section>
	<div class="container">
		<div class="login-card">
			<header class="info">
				<img src="/ui/swords.webp" alt="Clash of clans overlapping swords" class="logo" />
				<h2>Log in</h2>
				<p>By logging in, you will be able to start creating armies!</p>
			</header>
			<div class="btn-container">
				<GoogleLoginButton />
			</div>
		</div>
	</div>
</section>

<style>
	section {
		display: flex;
		align-items: center;
		padding: 50px var(--side-padding);
		flex: 1 0 0px;
	}

	section .container {
		display: flex;
		justify-content: center;
	}

	.login-card {
		display: inline-flex;
		flex-flow: column nowrap;
		align-items: center;
		background-color: var(--grey-900);
		border-radius: 8px;
		margin: 0 auto;
		max-width: 400px;
		width: 100%;
	}

	.logo {
		display: block;
		margin: 0 auto;
		max-width: 75px;
		width: 100%;
	}

	h2 {
		text-align: center;
		margin: 1em 0 0.75em 0;
	}

	p {
		text-align: center;
		color: var(--grey-400);
		max-width: 250px;
	}

	.info {
		padding: 2em;
	}

	.btn-container {
		border-top: 1px solid var(--grey-600);
		padding: 1.5em 2em;
		width: 100%;
	}

	@media (max-width: 425px) {
		.logo {
			max-width: 50px;
		}

		h2 {
			margin: 0.6em 0 0.4em 0;
		}
	}
</style>

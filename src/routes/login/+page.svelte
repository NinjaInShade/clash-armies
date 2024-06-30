<svelte:head>
	<title>ClashArmies • Login</title>
</svelte:head>

<section>
	<div class="container">
		<div class="login-card">
			<header class="info">
				<img src="/clash/ui/swords.png" alt="Clash of clans overlapping swords" class="logo" />
				<h2>Log in</h2>
				<p>By logging in, you will be able to start creating armies!</p>
			</header>
			<div class="btn-container">
				<a href="/login/google" class="login-btn">
					<img src="/icons/google-logo.svg" alt="Google logo" />
					Sign in with Google
				</a>
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

	.login-btn {
		display: flex;
		justify-content: center;
		align-items: center;
		font-family: 'Roboto';
		font-weight: 500;
		border-radius: 4px;
		background-color: #ffffff;
		border: 1px solid #747775;
		color: #1f1f1f;
		height: calc(40px * 1);
		padding: 0 calc(12px * 1);
		font-size: calc(14px * 1);
		line-height: calc(20px * 1);
		gap: calc(10px * 1);
		width: 100%;
	}

	.login-btn img {
		display: block;
		max-height: 20px;
		height: 100%;
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

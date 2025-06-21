<script lang="ts">
	import C from '$components';
	import GoogleLoginButton from '$components/GoogleLoginButton.svelte';
	import type { AppState } from '$types';
	import { getContext } from 'svelte';

	const app = getContext<AppState>('app');
</script>

<svelte:head>
	<!-- Note: title tag lives within the EditArmy component -->
	<meta
		name="description"
		content="Build your own Clash of Clans army with our simple and intuitive builder. Choose troops, spells, heroes, and write a guide to share with the community - or just plan your perfect attack."
	/>
	<link rel="canonical" href="https://clasharmies.com/army-builder" />
</svelte:head>

<section class="army" class:loggedIn={Boolean(app.user)}>
	<div class="container">
		<C.EditArmy />
	</div>
	{#if !app.user}
		<div class="requires-login">
			<div class="login-card">
				<h2>Log in</h2>
				<p>Log in to share your army!</p>
				<GoogleLoginButton />
			</div>
		</div>
	{/if}
</section>

<style>
	.army {
		position: relative;
		padding: 24px var(--side-padding) 32px var(--side-padding);
		flex: 1 0 0px;

		& .container {
			position: relative;
		}

		/* &:not(.loggedIn) {
			& .container {
				max-height: calc(100vh - var(--nav-height));
				overflow-y: auto;
			}
		} */

		@media (max-width: 500px) {
			padding: 16px var(--side-padding) 24px var(--side-padding);
		}
	}

	.requires-login {
		position: absolute;
		backdrop-filter: blur(4px);
		border-radius: 8px;
		padding: 48px var(--side-padding);
		width: 100%;
		height: 100%;
		inset: 0;

		& .login-card {
			display: flex;
			flex-flow: column nowrap;
			align-items: center;
			background-color: var(--grey-900);
			border-radius: 8px;
			margin: 0 auto;
			max-width: 275px;
			width: 100%;
			padding: 2em;
			box-shadow: rgba(22, 22, 22, 0.85) 0px 8px 24px 16px;
			border: 1px dashed var(--grey-500);

			& p {
				margin: 0.75em 0 1.25em 0;
				color: var(--grey-400);
				max-width: 250px;
			}
		}
	}
</style>

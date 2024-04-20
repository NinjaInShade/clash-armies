<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import C from '~/components';

	let pageRef: HTMLElement | null = null;

	onMount(() => {
		if (!pageRef) {
			return;
		}

		// Focus back to home button for UX
		const link = pageRef.querySelector<HTMLElement>('a[href="/"]');
		if (link) {
			link.focus();
		}
	});

	function getMessage(diagnostics: typeof $page) {
		const status = diagnostics.status;
		const error = diagnostics.error;
		if (status === 404) {
			return "This page doesn't exist warrior!";
		}
		if (!error) {
			return 'Internal error';
		}
		return error.message;
	}
</script>

<svelte:head>
	<title>ClashArmies • {$page.status}</title>
</svelte:head>

<header bind:this={pageRef}>
	<div class="container">
		<h1>{$page.status}!</h1>
		<p class="body">{getMessage($page)}</p>
		<C.Link href="/">Go to home</C.Link>
	</div>
</header>

<style>
	header {
		padding: 100px var(--side-padding);
	}

	header .container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	header p {
		margin: 16px 0 24px 0;
	}
</style>

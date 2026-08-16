<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Button from '$components/Button.svelte';

	let pageRef: HTMLElement | null = $state(null);

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

	function getMessage(diagnostics: typeof page) {
		const status = diagnostics.status;
		const error = diagnostics.error;
		if (!error) {
			return 'Internal error';
		}
		if (status === 404 && error.message === 'Not Found') {
			return "This page doesn't exist warrior!";
		}
		return error.message;
	}
</script>

<svelte:head>
	<title>ClashArmies • {page.status}</title>
</svelte:head>

<header bind:this={pageRef}>
	<div class="container">
		<h1>{page.status}!</h1>
		<p class="body">{getMessage(page)}</p>
		<Button asLink href="/">Go to home</Button>
	</div>
</header>

<style>
	header {
		padding: 100px var(--side-padding);
		flex: 1 0 0px;
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

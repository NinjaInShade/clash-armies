<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	const STORAGE_KEY = 'ca:feedback-banner-dismissed';

	let visible = $state(false);

	onMount(() => {
		// Use onMount to access localStorage due to SSR
		if (!localStorage.getItem(STORAGE_KEY)) {
			visible = true;
		}
	});

	function dismiss() {
		visible = false;
		localStorage.setItem(STORAGE_KEY, '1');
	}
</script>

{#if visible}
	<div class="feedback-banner" transition:fade={{ duration: 150 }}>
		<div class="container">
			<div class="content">
				<p>
					What should Clash Armies add next? <a
						href="https://docs.google.com/forms/d/e/1FAIpQLSc-9lcNdubb-4OD4X1b6WtRHyWJTLhA7g5CTx9e3SHXa2wL3Q/viewform?usp=preview"
						target="_blank"
						rel="noreferrer">Share your thoughts</a
					>
				</p>
				<button class="dismiss" type="button" onclick={dismiss} aria-label="Dismiss feedback banner">
					<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
						<path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.feedback-banner {
		background-color: var(--grey-850);
		border-bottom: 1px solid var(--grey-550);
		padding: 10px var(--side-padding);
	}

	.content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	p {
		font-size: var(--fs-sm);
		line-height: var(--fs-sm-lh);
		color: var(--grey-300);
		font-weight: 500;
	}

	a {
		color: var(--primary-400);
		text-decoration: underline;
		font-weight: 600;
	}

	a:hover {
		color: var(--primary-300);
	}

	.dismiss {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--grey-400);
		padding: 4px;
		border-radius: 4px;
		cursor: pointer;
	}

	.dismiss:hover {
		color: var(--grey-100);
	}
</style>

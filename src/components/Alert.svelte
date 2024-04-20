<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
	};
	let { children } = $props<Props>();
</script>

<div class="alert">
	<!-- /icons/warning.svg -->
	<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0ZM10 13C9.73478 13 9.48043 13.1054 9.29289 13.2929C9.10536 13.4804 9 13.7348 9 14C9 14.2652 9.10536 14.5196 9.29289 14.7071C9.48043 14.8946 9.73478 15 10 15C10.2652 15 10.5196 14.8946 10.7071 14.7071C10.8946 14.5196 11 14.2652 11 14C11 13.7348 10.8946 13.4804 10.7071 13.2929C10.5196 13.1054 10.2652 13 10 13ZM10 4C9.75507 4.00003 9.51866 4.08996 9.33563 4.25272C9.15259 4.41547 9.03566 4.63975 9.007 4.883L9 5V11C9.00028 11.2549 9.09788 11.5 9.27285 11.6854C9.44782 11.8707 9.68695 11.9822 9.94139 11.9972C10.1958 12.0121 10.4464 11.9293 10.6418 11.7657C10.8373 11.6021 10.9629 11.3701 10.993 11.117L11 11V5C11 4.73478 10.8946 4.48043 10.7071 4.29289C10.5196 4.10536 10.2652 4 10 4Z"
			fill="#C4C4C4"
		/>
	</svg>
	<p class="body">
		{@render children()}
	</p>
</div>

<style>
	.alert {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		background-color: var(--grey-800);
		border-radius: 8px;
		padding: 16px 24px;
		width: 100%;
		gap: 12px;
	}

	.alert .body {
		font-weight: 500;
		flex: 1 0 0px;
	}
</style>

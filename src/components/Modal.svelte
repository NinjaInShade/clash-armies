<script lang="ts">
	import type { SvelteComponentGeneric } from '~/lib/state.svelte';
	import FocusTrap from './FocusTrap.svelte';

	type Props = {
		/** Sets the title of the modal */
		title?: string;
		/** Sets the component the modal renders. Uses <slot /> as fallback */
		component?: SvelteComponentGeneric;
		/** Function that closes the modal */
		close: () => void;
	};
	let { title, component, close, ...componentProps } = $props<Props>();

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
		}
	}
</script>

<svelte:window on:keydown={onKeyDown} />

<FocusTrap>
	<div class="modal">
		<div class="modal-header">
			<p class="modal-title">{title ?? ''}</p>
			<button class="close-btn" on:click={close}>
				<img src="/clash/ui/close.png" alt="Close icon" />
			</button>
		</div>
		<div class="modal-content">
			{#if component}
				<svelte:component this={component} {...componentProps} />
			{:else}
				<slot />
			{/if}
		</div>
		<div class="modal-footer">
			{#if $$slots.controls}
				<slot name="controls" />
			{:else}
				<button class="btn" on:click={close}>Close</button>
			{/if}
		</div>
	</div>
</FocusTrap>

<style>
	.modal {
		display: flex;
		flex-flow: column nowrap;
		position: absolute;
		transform: translate(-50%, -50%);
		box-shadow: 0 7px 100px 0 hsla(0, 0%, 0%, 0.9);
		border-radius: 4px;
		background-color: var(--grey-800);
		max-width: var(--modal-width, 575px);
		height: var(--modal-height, auto);
		width: 100%;
		left: 50%;
		top: 50%;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: var(--grey-900);
		padding: 14px 18px;
		height: 70px;
	}

	.modal-title {
		font-family: 'Clash', sans-serif;
		color: var(--grey-100);
		line-height: 1.35em;
		font-size: 1.35em;
	}

	.close-btn {
		height: 40px;
	}

	.close-btn img {
		max-height: 100%;
		width: auto;
	}

	.modal-footer {
		border-top: 1px solid var(--grey-850);
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 0.5em;
	}

	.modal-content {
		padding: 24px 18px;
		flex: 1 0 0px;
	}

	.modal-footer {
		padding: 14px 18px;
	}
</style>

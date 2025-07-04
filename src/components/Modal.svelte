<script lang="ts">
	import type { Snippet, Component } from 'svelte';
	import FocusTrap from './FocusTrap.svelte';
	import Button from './Button.svelte';

	type ComponentRendering = {
		/** Sets the component the modal renders. Uses children as fallback */
		component: Component;
		children?: never;
	};
	type ChildrenRendering = {
		/** The modals content if the component prop is not passed in */
		children: Snippet;
		component?: never;
	};
	type Props = {
		/** Sets the title of the modal */
		title?: string;
		/** Function that closes the modal */
		close: (rtn?: any) => void;
		/** Optional controls snippet, rendered in the footer */
		controls?: Snippet;
	} & (ComponentRendering | ChildrenRendering);

	let { title, component, close, children, controls, ...componentProps }: Props = $props();

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
		}
	}
</script>

<svelte:window onkeydown={onKeyDown} />

<FocusTrap>
	<div class="modal">
		<div class="modal-header">
			<h2 class="modal-title">{title ?? ''}</h2>
			<button type="button" class="close-btn" onclick={() => close()}>
				<img src="/ui/close.webp" alt="Close icon" />
			</button>
		</div>
		<div class="modal-content">
			{#if component}
				{@const SvelteComponent = component}
				<SvelteComponent {...componentProps} />
			{:else if children}
				{@render children()}
			{/if}
		</div>
		<div class="modal-footer">
			{#if controls}
				{@render controls()}
			{:else}
				<Button onClick={() => close()}>Close</Button>
			{/if}
		</div>
	</div>
</FocusTrap>

<style>
	.modal {
		display: flex;
		flex-flow: column nowrap;
		position: fixed;
		transform: translate(-50%, 50%);
		box-shadow: 0 7px 100px 0 hsla(0, 0%, 0%, 0.9);
		background-color: var(--grey-800);
		height: var(--modal-height, auto);
		width: var(--modal-width, 575px);
		max-width: calc(100dvw - 3em);
		max-height: calc(100dvh - 3em);
		border-radius: 6px;
		overflow: hidden;
		bottom: 50%;
		left: 50%;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: var(--grey-900);
		padding: 14px 24px;
		height: 70px;
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
		padding: 24px 24px;
		overflow-y: auto;
		height: 100%;
	}

	.modal-footer {
		padding: 14px 24px;
	}

	@media (max-width: 450px) {
		.modal {
			max-width: calc(100dvw - 2em);
			max-height: calc(100dvh - 2em);
		}
	}
</style>

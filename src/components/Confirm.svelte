<script lang="ts">
	import Button from './Button.svelte';
	import Modal from './Modal.svelte';

	type Props = {
		/** Function that closes the modal */
		close: (confirmed: boolean) => void;
		/** The confirmation text */
		confirmText: string;
	};
	const { close, confirmText }: Props = $props();

	function cancel() {
		close(false);
	}

	function confirm() {
		close(true);
	}
</script>

{#snippet controls()}
	<div class="controls">
		<Button onClick={cancel}>Cancel</Button>
		<Button onClick={confirm} theme="danger">Confirm</Button>
	</div>
{/snippet}

<Modal title="Confirm action" {close} {controls}>
	<p>{confirmText}</p>
</Modal>

<style>
	p {
		color: var(--grey-100);
	}

	.controls {
		display: flex;
		gap: 0.5em;
	}
</style>

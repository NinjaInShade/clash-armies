<script lang="ts">
	import C from '$components';

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
		<C.Button onClick={cancel}>Cancel</C.Button>
		<C.Button onClick={confirm} theme="danger">Confirm</C.Button>
	</div>
{/snippet}

<C.Modal title="Confirm action" {close} {controls}>
	<p>{confirmText}</p>
</C.Modal>

<style>
	p {
		color: var(--grey-100);
	}

	.controls {
		display: flex;
		gap: 0.5em;
	}
</style>

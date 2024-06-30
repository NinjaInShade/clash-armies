<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState, User, FetchErrors } from '~/lib/shared/types';
	import { invalidateAll, goto } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import C from '~/components';

	type Props = {
		/** Function that closes the modal */
		close: () => void;
		/** Existing town hall */
		user: User;
	};
	const { close, user }: Props = $props();
	const app = getContext<AppState>('app');

	let username = $state<string>(user.username);

	let errors = $state<FetchErrors | null>(null);

	async function saveUser() {
		const data = { id: user.id, username };
		const response = await fetch('/users?/saveUser', { method: 'POST', body: JSON.stringify(data) });
		const result = deserialize(await response.text());
		if (result.type === 'failure') {
			errors = result.data?.errors as FetchErrors;
			return;
		}
		if (result.type === 'redirect') {
			goto(result.location);
		} else {
			errors = null;
			await invalidateAll();
		}
		close();
	}
</script>

{#snippet controls()}
	<div class="controls">
		<C.Button onclick={close}>Cancel</C.Button>
		<C.Button onclick={saveUser}>Save</C.Button>
	</div>
{/snippet}

<C.Modal title="Edit {app.user && app.user.username === user.username ? 'account' : 'user'}" {close} {controls}>
	{#if errors}
		<div class="errors-container">
			<C.Errors {errors} />
		</div>
	{/if}

	<C.Fieldset label="Username" htmlName="username" style="margin-bottom: 1em">
		<C.Input bind:value={username} name="username" --input-width="100%" />
	</C.Fieldset>
</C.Modal>

<style>
	.errors-container {
		margin-bottom: 1em;
	}

	.controls {
		display: flex;
		justify-content: space-between;
		width: 100%;
		gap: 0.5em;
	}
</style>

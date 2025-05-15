<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState, User, FetchErrors } from '$types';
	import { invalidateAll, goto } from '$app/navigation';
	import C from '$components';

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
		const trimmedUsername = username.trim();
		const data = { id: user.id, username: trimmedUsername };
		const response = await fetch('/api/users', {
			method: 'POST',
			body: JSON.stringify(data),
			headers: { 'Content-Type': 'application/json' },
		});
		const result = await response.json();
		if (result.errors) {
			errors = result.errors as FetchErrors;
			return;
		}
		if (response.status === 200) {
			// Navigate in case username has changed
			await invalidateAll();
			goto(`/users/${trimmedUsername}`);
		} else {
			errors = `${response.status} error`;
			return;
		}
		close();
	}
</script>

{#snippet controls()}
	<div class="controls">
		<C.Button onClick={close}>Cancel</C.Button>
		<C.Button onClick={saveUser}>Save</C.Button>
	</div>
{/snippet}

<C.Modal title="Edit {app.user && app.user.username === user.username ? 'account' : 'user'}" {close} {controls}>
	{#if errors}
		<div class="errors-container">
			<C.Errors {errors} />
		</div>
	{/if}

	<C.Fieldset label="Username" htmlName="username" style="margin-bottom: 1em" --input-width="100%">
		<C.Input bind:value={username} name="username" />
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

<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState, User } from '$types';
	import { HTTPError, type APIErrors } from '$shared/http';
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

	let errors = $state<APIErrors | null>(null);

	async function saveUser() {
		const trimmedUsername = username.trim();
		const data = { id: user.id, username: trimmedUsername };

		try {
			await app.http.post('/api/users', data);
		} catch (err: unknown) {
			if (err instanceof HTTPError) {
				errors = err.errors ?? err.message;
			}
			return;
		}

		// Navigate in case username has changed
		await invalidateAll();
		await goto(`/users/${trimmedUsername}`);
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
	<div class="errors-container">
		<C.Errors {errors} />
	</div>

	<C.Fieldset label="Username" htmlName="username" style="margin-bottom: 1em" --input-width="100%">
		<C.Input bind:value={username} name="username" />
	</C.Fieldset>
</C.Modal>

<style>
	.errors-container:not(:empty) {
		margin-bottom: 1em;
	}

	.controls {
		display: flex;
		justify-content: space-between;
		width: 100%;
		gap: 0.5em;
	}
</style>

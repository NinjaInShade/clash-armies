<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState, User } from '$types';
	import { HTTPError, type APIErrors } from '$shared/http';
	import { invalidateAll, goto } from '$app/navigation';
	import Button from '$components/Button.svelte';
	import Modal from '$components/Modal.svelte';
	import Errors from '$components/Errors.svelte';
	import Fieldset from '$components/Fieldset.svelte';
	import Input from '$components/Input.svelte';

	type Props = {
		/** Function that closes the modal */
		close: () => void;
		/** Existing town hall */
		user: User;
	};
	const { close, user }: Props = $props();
	const app = getContext<AppState>('app');

	let username = $state<string>(user.username);
	let playerTag = $state<string | null>(user.playerTag);

	let errors = $state<APIErrors | null>(null);

	async function saveUser() {
		const trimmedUsername = username.trim();
		const trimmerPlayerTag = playerTag?.trim();
		const data = {
			id: user.id,
			username: trimmedUsername,
			playerTag: trimmerPlayerTag || null,
		};

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
		<Button onClick={close}>Cancel</Button>
		<Button onClick={saveUser}>Save</Button>
	</div>
{/snippet}

<Modal title="Edit {app.user && app.user.username === user.username ? 'account' : 'user'}" {close} {controls}>
	<div class="errors-container">
		<Errors {errors} />
	</div>

	<Fieldset label="Username" htmlName="username" style="margin-bottom: 1em" --input-width="100%">
		<Input bind:value={username} name="username" />
	</Fieldset>

	<Fieldset label="Player tag" htmlName="playerTag" style="margin-bottom: 1em" --input-width="100%">
		<Input bind:value={playerTag} name="playerTag" placeholder="#XXXXXXXX" />
	</Fieldset>
</Modal>

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

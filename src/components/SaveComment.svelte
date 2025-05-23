<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '$types';
	import { MAX_COMMENT_LENGTH } from '$shared/utils';
	import { invalidateAll } from '$app/navigation';
	import TextArea from './TextArea.svelte';
	import ActionButton from './ActionButton.svelte';
	import type { ArmyModel, ArmyComment } from '$models';

	type Props = {
		model: ArmyModel;
		comment?: ArmyComment;
		replyTo?: number | null;
		onSave?: () => void;
	};
	const { model, comment, replyTo, onSave = () => {} }: Props = $props();

	const app = getContext<AppState>('app');

	let commentText = $state<string | null>(comment?.comment ?? null);

	async function saveComment() {
		const data = {
			id: comment?.id,
			comment: commentText,
			replyTo: replyTo ?? null,
			armyId: model.id,
		};

		try {
			await app.http.post('/api/armies/comments', data);
		} catch {
			app.notify({
				title: 'Failed action',
				description: `There was a problem saving this comment`,
				theme: 'failure',
			});
			return;
		}

		await invalidateAll();
		commentText = null;
		onSave();
	}
</script>

<div class="textarea-container">
	<TextArea
		bind:value={commentText}
		placeholder={comment ? undefined : replyTo !== undefined ? 'Add your reply...' : 'Add your comment...'}
		maxlength={MAX_COMMENT_LENGTH}
		--input-width="100%"
		--input-min-height="5em"
	/>
	<div class="save-button">
		<ActionButton disabled={!commentText?.length} onclick={saveComment}>{comment ? 'Save' : 'Add'}</ActionButton>
	</div>
</div>

<style>
	.textarea-container {
		position: relative;
	}

	.textarea-container :global(.input) {
		padding-bottom: 42px;
	}

	.save-button {
		position: absolute;
		bottom: 10px;
		right: 10px;
	}
</style>

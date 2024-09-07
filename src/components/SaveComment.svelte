<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState, Comment } from '$types';
	import { MAX_COMMENT_LENGTH } from '$shared/utils';
	import { invalidateAll } from '$app/navigation';
	import C from '$components';

	type Props = {
		armyId: number;
		comment?: Comment;
		replyTo?: number | null;
		onSave?: () => void;
	};
	const { armyId, comment, replyTo, onSave = () => {} }: Props = $props();

	const app = getContext<AppState>('app');

	let commentText = $state<string | null>(comment?.comment ?? null);

	async function saveComment() {
		const data = {
			id: comment?.id,
			comment: commentText,
			replyTo: replyTo ?? null,
			armyId,
		};
		const response = await fetch('/armies/comments', {
			method: 'POST',
			body: JSON.stringify(data),
			headers: { 'Content-Type': 'application/json' },
		});
		const result = await response.json();
		if (result.errors || response.status !== 200) {
			app.notify({
				title: 'Failed action',
				description: `There was a problem saving comment`,
				theme: 'failure',
			});
		}
		if (result.errors) {
			console.error(`Error:`, result.errors);
			return;
		}
		if (response.status !== 200) {
			console.error(`${response.status} error`);
			return;
		}
		await invalidateAll();
		commentText = null;
		onSave();
	}
</script>

<div class="textarea-container">
	<C.TextArea
		bind:value={commentText}
		placeholder={comment ? undefined : replyTo !== undefined ? 'Add your reply...' : 'Add your comment...'}
		maxlength={MAX_COMMENT_LENGTH}
		--input-width="100%"
		--input-min-height="5em"
	/>
	<C.ActionButton class="add-comment-btn" disabled={!commentText?.length} onclick={saveComment}>{comment ? 'Save' : 'Add'}</C.ActionButton>
</div>

<style>
	.textarea-container {
		position: relative;
	}

	.textarea-container :global(.input) {
		padding-bottom: 42px;
	}

	:global(.add-comment-btn) {
		position: absolute;
		bottom: 10px;
		right: 10px;
	}
</style>

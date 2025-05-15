<script lang="ts" module>
	let editingComment = $state<number | null>(null);
	let addingReplyTo = $state<number | null>(null);
</script>

<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '$types';
	import { intlFormatDistance } from 'date-fns';
	import { invalidateAll } from '$app/navigation';
	import SaveComment from './SaveComment.svelte';
	import type { ArmyModel, ArmyComment } from '$models';

	type Props = {
		model: ArmyModel;
		comment: ArmyComment;
	};
	const { model, comment }: Props = $props();

	const app = getContext<AppState>('app');

	let editing = $derived(editingComment === comment.id);
	let replying = $derived(addingReplyTo === comment.id);

	function formatCreatedTime(createdTime: Date) {
		// Add a second as comments created just now will cause the below function to return "In 0 secs"
		const now = Date.now() + 1000;
		return intlFormatDistance(createdTime, now, { style: 'short', numeric: 'always' });
	}

	async function deleteComment() {
		const confirmed = await app.confirm('Are you sure you want to delete this comment?');
		if (!confirmed) return;
		const response = await fetch('/api/armies/comments', {
			method: 'DELETE',
			body: JSON.stringify(comment.id),
			headers: { 'Content-Type': 'application/json' },
		});
		const result = await response.json();
		if (result.errors || response.status !== 200) {
			app.notify({
				title: 'Failed action',
				description: `There was a problem deleting this comment`,
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
	}

	async function toggleEditComment() {
		if (editingComment !== null && editingComment !== comment.id) {
			const confirmed = await app.confirm('You are already editing another comment. Editing this will cancel your other edit. Are you sure?');
			if (!confirmed) return;
			editingComment = comment.id;
		} else {
			editingComment = editingComment ? null : comment.id;
		}
	}

	async function toggleReply() {
		if (addingReplyTo !== null && addingReplyTo !== comment.id) {
			const confirmed = await app.confirm('You are already replying to another comment. Editing this will cancel your other reply. Are you sure?');
			if (!confirmed) return;
			addingReplyTo = comment.id;
		} else {
			addingReplyTo = addingReplyTo ? null : comment.id;
		}
	}
</script>

{#snippet controls(layout: 'desktop' | 'mobile')}
	<div class="controls {layout}">
		{#if app.user}
			{#if app.user.id === comment.createdBy || app.user.hasRoles('admin')}
				<button class="control-btn delete-btn" onclick={deleteComment}>Delete</button>
				<button class="control-btn" onclick={toggleEditComment}>{editing ? 'Cancel edit' : 'Edit'}</button>
			{/if}
			<button class="control-btn" onclick={toggleReply}>
				<svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M7 4.5V0.5L0 7.5L7 14.5V10.4C12 10.4 15.5 12 18 15.5C17 10.5 14 5.5 7 4.5Z" fill="#E79C3E" />
				</svg>
				{replying ? 'Cancel reply' : 'Reply'}
			</button>
		{/if}
	</div>
{/snippet}

<li class="card" id="comment-{comment.id}">
	<div class="header">
		<div class="details">
			<a class="author" href="/users/{comment.username}">@{comment.username}</a>
			<svg class="separator" width="6" height="6" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M3.99984 0.000325508C4.54843 0.000325508 5.06577 0.104488 5.55186 0.312813C6.03795 0.521138 6.46154 0.805848 6.82264 1.16694C7.18374 1.52804 7.47192 1.95511 7.68719 2.44814C7.90246 2.94118 8.00662 3.45852 7.99967 4.00016C7.99967 4.5557 7.89551 5.07304 7.68719 5.55218C7.47886 6.03133 7.19415 6.45492 6.83306 6.82296C6.47196 7.19101 6.04489 7.47919 5.55186 7.68751C5.05882 7.89584 4.54148 8 3.99984 8C3.4443 8 2.92696 7.89584 2.44782 7.68751C1.96867 7.47919 1.54508 7.19448 1.17704 6.83338C0.808995 6.47228 0.520812 6.04869 0.312487 5.5626C0.104162 5.07651 0 4.5557 0 4.00016C0 3.45157 0.104162 2.93423 0.312487 2.44814C0.520812 1.96205 0.805523 1.53846 1.16662 1.17736C1.52772 0.816265 1.95131 0.528082 2.4374 0.312813C2.92349 0.0975438 3.4443 -0.00661865 3.99984 0.000325508Z"
					fill="currentColor"
				/>
			</svg>
			<p class="time-ago">{formatCreatedTime(comment.createdTime)}</p>
		</div>
		{@render controls('desktop')}
	</div>

	{#if editing}
		<div class="comment">
			<SaveComment {model} {comment} replyTo={comment.replyTo} onSave={() => (editingComment = null)} />
		</div>
	{:else}
		<p class="comment">{comment.comment}</p>
	{/if}

	{@render controls('mobile')}
</li>

{#if replying}
	<SaveComment {model} replyTo={comment.id} onSave={() => (addingReplyTo = null)} />
{/if}

<style>
	.card {
		background-color: var(--grey-800);
		border: 1px dashed var(--grey-500);
		border-radius: 8px;
		padding: 1em;
		width: 100%;
	}
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-flow: row wrap;
		gap: 0.5em;
	}
	.comment {
		margin-top: 0.5em;
		color: var(--grey-300);
	}
	.details {
		display: flex;
		align-items: center;
		flex-flow: row wrap;
		gap: 0.4em;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 0.8em;
	}
	.author,
	.time-ago,
	.control-btn,
	.comment {
		font-size: var(--fs);
		line-height: var(--fs-lh);
	}
	.author {
		color: var(--primary-400);
		font-weight: 500;
		max-width: 15ch;
		text-overflow: ellipsis;
		overflow: hidden;
	}
	.author:hover {
		text-decoration: underline;
	}
	.time-ago,
	.separator {
		color: var(--grey-450);
	}
	.control-btn {
		display: flex;
		align-items: center;
		color: var(--primary-400);
		gap: 0.3em;
	}
	.delete-btn {
		color: #e05353;
	}
	.controls.mobile {
		display: none;
	}

	@media (max-width: 575px) {
		.separator {
			display: none;
		}
		.controls.desktop {
			display: none;
		}
		.controls.mobile {
			display: flex;
			margin-top: 0.5em;
		}
	}

	@media (max-width: 375px) {
		.details {
			flex-flow: column nowrap;
			align-items: flex-start;
			gap: 0.1em;
		}
	}
</style>

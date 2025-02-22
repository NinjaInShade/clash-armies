<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState, Comment, StructuredComment } from '$types';
	import CommentsList from './CommentsList.svelte';
	import SaveComment from './SaveComment.svelte';

	type Props = {
		armyId: number;
		comments: Comment[];
	};
	const { armyId, comments }: Props = $props();

	const app = getContext<AppState>('app');
	const structuredComments = $derived(structureComments(comments));

	function structureComments(comments: Comment[]) {
		const map: Record<string, StructuredComment> = {};
		const structured: StructuredComment[] = [];
		for (const comment of comments) {
			map[comment.id] = { ...comment, replies: [] };
		}
		for (const comment of comments) {
			if (comment.replyTo === null) {
				// Top-level comment
				structured.push(map[comment.id]);
			} else if (map[comment.replyTo]) {
				// A reply, so add it to the replies of the parent comment
				map[comment.replyTo].replies.push(map[comment.id]);
			}
		}
		return structured;
	}
</script>

<h2 class="title">
	<svg width="27" height="21" viewBox="0 0 27 21" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M19.5 7.5C19.5 3.35625 15.1359 0 9.75 0C4.36406 0 0 3.35625 0 7.5C0 9.10781 0.660937 10.5891 1.78125 11.8125C1.15312 13.2281 0.117187 14.3531 0.103125 14.3672C0 14.475 -0.028125 14.6344 0.0328125 14.775C0.09375 14.9156 0.225 15 0.375 15C2.09062 15 3.51094 14.4234 4.53281 13.8281C6.04219 14.5641 7.82812 15 9.75 15C15.1359 15 19.5 11.6438 19.5 7.5ZM25.2187 17.8125C26.3391 16.5938 27 15.1078 27 13.5C27 10.3641 24.4922 7.67812 20.9391 6.55781C20.9812 6.86719 21 7.18125 21 7.5C21 12.4641 15.9516 16.5 9.75 16.5C9.24375 16.5 8.75156 16.4625 8.26406 16.4109C9.74062 19.1063 13.2094 21 17.25 21C19.1719 21 20.9578 20.5688 22.4672 19.8281C23.4891 20.4234 24.9094 21 26.625 21C26.775 21 26.9109 20.9109 26.9672 20.775C27.0281 20.6391 27 20.4797 26.8969 20.3672C26.8828 20.3531 25.8469 19.2328 25.2187 17.8125Z"
			fill="#EFEFEF"
		/>
	</svg>
	{comments.length}
	{comments.length === 1 ? 'comment' : 'comments'}
</h2>

<div class="comments-list-container">
	<CommentsList {armyId} comments={structuredComments} />
</div>

{#if app.user}
	<div class="add-comment">
		<SaveComment {armyId} />
	</div>
{/if}

<style>
	.title {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		font-family: 'Poppins', sans-serif;
		font-size: var(--fs);
		line-height: var(--fs-lh);
		color: var(--grey-100);
		font-weight: bold;
		letter-spacing: 2px;
		text-transform: uppercase;
		margin-bottom: 16px;
		gap: 10px;
	}

	.comments-list-container:has(:global(+ .add-comment)) :global(> .comments-list:not(:empty)) {
		margin-bottom: 1em;
	}
</style>

<script lang="ts" context="module">
	const MAX_DEPTH = 2;
</script>

<script lang="ts">
	import type { StructuredComment } from '~/lib/shared/types';
	import CommentCard from './Comment.svelte';

	type Props = {
		armyId: number;
		comments: StructuredComment[];
		depth?: number;
	};
	const { armyId, comments, depth = 0 }: Props = $props();

	const sortedComments = $derived([...comments].sort((a, b) => +a.createdTime - +b.createdTime));
</script>

<ul class="comments-list" class:nested={depth > 0 && depth <= MAX_DEPTH} style="--nest-depth: {depth === 0 || depth > MAX_DEPTH ? 0 : 1};">
	{#each sortedComments as comment (comment.id)}
		<CommentCard {armyId} {comment} />
		{#if comment.replies.length}
			<svelte:self {armyId} comments={comment.replies} depth={depth + 1} />
		{/if}
	{/each}
</ul>

<style>
	.comments-list {
		--nest-size: 40px;
		display: flex;
		flex-flow: column nowrap;
		margin-left: calc(var(--nest-size) * var(--nest-depth));
		gap: 0.8em;
		position: relative;
	}
	.comments-list.nested::before {
		content: '';
		position: absolute;
		background-color: var(--grey-500);
		height: 100%;
		width: 1px;
		top: 0;
		left: calc((var(--nest-size) / 2) * -1);
	}

	@media (max-width: 650px) {
		.comments-list {
			--nest-size: 32px;
		}
	}
</style>

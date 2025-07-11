<script lang="ts" module>
	const MAX_DEPTH = 2;
</script>

<script lang="ts">
	import CommentCard from './Comment.svelte';
	import Self from './CommentsList.svelte';
	import type { ArmyModel, StructuredArmyComment } from '$models';

	type Props = {
		model: ArmyModel;
		comments: StructuredArmyComment[];
		depth?: number;
	};
	const { model, comments, depth = 0 }: Props = $props();

	const sortedComments = $derived(comments.toSorted((a, b) => +a.createdTime - +b.createdTime));
</script>

<ul class="comments-list" class:nested={depth > 0 && depth <= MAX_DEPTH} style="--nest-depth: {depth === 0 || depth > MAX_DEPTH ? 0 : 1};">
	{#each sortedComments as comment (comment.id)}
		<CommentCard {model} {comment} />
		{#if comment.replies.length}
			<Self {model} comments={comment.replies} depth={depth + 1} />
		{/if}
	{/each}
</ul>

<style>
	.comments-list {
		--nest-size: 40px;
		display: flex;
		flex-flow: column nowrap;
		margin-left: calc(var(--nest-size) * var(--nest-depth));
		position: relative;
		gap: 10px;
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

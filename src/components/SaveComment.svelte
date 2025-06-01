<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { AppState } from '$types';
	import { MAX_COMMENT_LENGTH } from '$shared/utils';
	import { invalidateAll } from '$app/navigation';
	import TextArea from './TextArea.svelte';
	import Button from './Button.svelte';
	import type { ArmyModel, ArmyComment } from '$models';

	type Props = {
		model: ArmyModel;
		comment?: ArmyComment;
		replyTo?: number | null;
		placeholder?: string;
		cancelSave?: () => void;
		onSave?: () => void;
		style?: string;
	};
	const { model, comment, replyTo, placeholder, cancelSave, onSave = () => {} }: Props = $props();

	const app = getContext<AppState>('app');

	let inputRef = $state<TextArea | undefined>(undefined);
	let commentText = $state<string | null>(comment?.comment ?? null);

	const saveDisabled = $derived(!commentText?.length);
	const placeholderText = $derived.by(() => {
		if (placeholder) {
			return placeholder;
		}
		if (comment) {
			return undefined;
		}
		if (replyTo !== undefined) {
			return "What's your take?";
		}
		if (!model.comments.length) {
			return 'Be the first to share your thoughts!';
		}
		return 'Share your thoughts!';
	});

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

	async function onInputKeyDown(ev: KeyboardEvent) {
		const k = ev.key.toLowerCase();
		const mod = ev.ctrlKey || ev.metaKey;
		if (mod && k === 'enter' && !saveDisabled) {
			await saveComment();
		}
	}

	export function focus() {
		if (inputRef) {
			inputRef.focus();
		}
	}
</script>

<div class="save-comment">
	{#if app.user}
		<TextArea
			bind:this={inputRef}
			bind:value={commentText}
			placeholder={placeholderText}
			maxlength={MAX_COMMENT_LENGTH}
			onkeydown={onInputKeyDown}
			--input-width="100%"
			--input-min-height="5em"
		/>
		<div class="save-button">
			{#if cancelSave}
				<button class="utility-btn regular" onclick={cancelSave} style:--fs-weight="500">Cancel</button>
			{/if}
			<button
				class="utility-btn regular"
				onclick={saveComment}
				disabled={saveDisabled}
				title={saveDisabled ? 'Cannot save empty comment' : undefined}
				style:--fs-weight="500">{comment ? 'Save' : 'Post'}</button
			>
		</div>
	{:else}
		<div class="requires-auth">
			<img src="/clash/ui/barb-king-2.png" alt="Clash of Clans Barbarian King" />
			<div>
				<h2>What's your take?</h2>
				<p class="body">
					{#if model.comments.length > 0}
						Log in to leave a comment!
					{:else}
						Log in to be the first to comment!
					{/if}
				</p>
				<Button onclick={app.requireAuth}>Log in</Button>
			</div>
		</div>
	{/if}
</div>

<style>
	.save-comment {
		position: relative;
		background-color: var(--grey-800);
		border: 1px dashed var(--grey-500);
		border-radius: 4px;

		& :global(.input) {
			resize: vertical;
			padding-bottom: 42px;
			background: none;
			border-color: transparent;
		}
		& .save-button {
			display: flex;
			gap: 4px;
			position: absolute;
			bottom: 10px;
			right: 10px;
		}

		& .requires-auth {
			display: flex;
			flex-flow: row nowrap;
			justify-content: center;
			align-items: center;
			padding: 24px;
			gap: 24px;

			& h2,
			& p {
				white-space: nowrap;
			}

			& p {
				margin: 8px 0 16px 0;
			}

			@media (max-width: 600px) {
				flex-flow: column nowrap;

				& img {
					max-width: 100%;
					height: auto;
				}

				& h2,
				& p {
					white-space: normal;
					text-align: center;
				}

				& > div {
					display: flex;
					flex-flow: column nowrap;
					justify-content: center;
					align-items: center;
				}
			}
		}
	}
</style>

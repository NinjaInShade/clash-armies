<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { getContext, type Snippet } from 'svelte';

	type Props = {
		/** Sets the bound value */
		value: string | null | undefined;
		/** Sets the onchange handler */
		onChange?: (value: string | null) => Promise<void> | void;
		/** Sets the disabled state */
		disabled?: boolean;
		/** Sets the error message */
		error?: string | null;
		/** Sets the placeholder display */
		placeholder?: string;
		/** Sets the container class, useful for updating --input-width variables in media queries */
		containerClass?: string;
		/** Icon to render inside the input */
		icon?: Snippet;
	} & HTMLTextareaAttributes;
	let { value = $bindable(), onChange, disabled, error, placeholder, containerClass, icon, ...rest }: Props = $props();

	// Passed down from context in parent <Fieldset />
	const htmlName = getContext<string>('htmlName');

	let txRef = $state<HTMLTextAreaElement | undefined>();

	$effect(() => {
		if (txRef) {
			autoGrow();
		}
	});

	async function _onChange(e: Event) {
		autoGrow();
		if (!onChange) {
			return;
		}
		const el = e.target as HTMLTextAreaElement;
		await onChange(el?.value || null);
	}

	function autoGrow() {
		if (!txRef) return;
		txRef.style.height = 'auto';
		txRef.style.height = txRef.scrollHeight + 2.5 + 'px';
	}
</script>

<!-- Input -->
<div class="outer-container {containerClass ?? ''} {error ? 'error' : ''}">
	<div class="inner-container">
		{#if icon}
			<div class="icon-container">
				{@render icon()}
			</div>
		{/if}
		<textarea bind:value oninput={_onChange} class="input focus-grey" name={htmlName} id={htmlName} {disabled} {placeholder} {...rest} bind:this={txRef}
		></textarea>
	</div>
	{#if error}
		<small class="error-container">
			<span>{error}</span>
		</small>
	{/if}
</div>

<style>
	.outer-container {
		position: relative;
		max-width: var(--input-width, 250px);
		width: 100%;
	}
	.inner-container {
		position: relative;
		width: 100%;
	}
	.icon-container {
		position: absolute;
		transform: translateY(-50%);
		top: 50%;
		left: 16px;
	}
	.icon-container :global(svg) {
		display: block;
		max-width: 14px;
		height: auto;
	}
	.icon-container :global(svg path) {
		fill: var(--grey-500);
	}

	/* Input */
	.input {
		background-color: var(--grey-700);
		border: 1px solid var(--grey-500);
		font-size: var(--fs);
		line-height: var(--fs-lh);
		color: var(--grey-100);
		min-height: var(--input-min-height, auto);
		border-radius: 6px;
		padding: 7px 16px;
		width: 100%;
		height: 100%;
		display: block;
	}
	.icon-container + .input {
		padding-left: 34px;
	}

	/* Input states */
	.input::placeholder {
		color: var(--grey-500);
	}

	.input:active {
		outline: none;
		border: 1px solid var(--grey-400);
	}

	.input:disabled {
		user-select: none;
		cursor: not-allowed;
		opacity: 0.5;
	}

	/* Errors  */

	.outer-container.error .input {
		border: 1px solid var(--error-400);
	}

	.error-container {
		display: flex;
		justify-content: flex-start;
		align-items: flex-start;
		margin-top: 6px;
		user-select: text;
		cursor: auto;
	}

	.error-container span {
		font-size: var(--fs-sm);
		line-height: var(--fs-sm-lh);
		color: var(--error-400);
		white-space: break-spaces;
	}

	@media (max-width: 850px) {
		.icon-container :global(svg) {
			max-width: 13px;
		}
	}
</style>

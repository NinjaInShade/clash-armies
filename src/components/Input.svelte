<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { getContext, type Snippet } from 'svelte';

	type Props = {
		/** Sets the bound value */
		value: string | number | null | undefined;
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
	} & HTMLInputAttributes;
	let { value = $bindable(), onChange, disabled, error, placeholder, containerClass, icon, ...rest }: Props = $props();

	// Passed down from context in parent <Fieldset />
	const htmlName = getContext<string>('htmlName');

	async function _onChange(e: Event) {
		if (!onChange) {
			return;
		}
		const el = e.target as HTMLInputElement;
		await onChange(el?.value || null);
	}
</script>

<!-- Input -->
<div class="outer-container {containerClass ?? ''}" class:error>
	<div class="inner-container">
		{#if icon}
			<div class="icon-container">
				{@render icon()}
			</div>
		{/if}
		<input bind:value oninput={_onChange} class="input focus-grey" type="text" name={htmlName} id={htmlName} {disabled} {placeholder} {...rest} />
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
		color: var(--grey-100);
		top: 50%;
		left: 16px;
	}
	.icon-container :global(svg) {
		display: block;
		max-width: 14px;
		height: auto;
	}

	/* Input */
	.input {
		background-color: var(--grey-700);
		border: 1px solid var(--grey-500);
		font-size: var(--fs);
		line-height: var(--fs-lh);
		color: var(--grey-100);
		border-radius: 6px;
		padding: 7px 16px;
		width: 100%;
	}
	.icon-container + .input {
		padding-left: 34px;
	}
	.icon-container:has(+ .input:placeholder-shown) {
		color: var(--grey-500);
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

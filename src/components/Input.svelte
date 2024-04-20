<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { getContext } from 'svelte';

	type Props = {
		/** Sets the bound value */
		value: string | null;
		/** Sets the onchange handler */
		onChange?: (value: string | null) => Promise<void> | void;
		/** Sets the disabled state */
		disabled?: boolean;
		/** Sets the error message */
		error?: string | null;
		/** Sets the placeholder display */
		placeholder?: string;
	} & HTMLInputAttributes;
	let { value, onChange, disabled, error, placeholder, ...rest } = $props<Props>();

	// Passed down from context in parent <Fieldset />
	const htmlName = getContext<string>('htmlName');

	async function _onChange(e: Event) {
		if (!onChange) {
			return;
		}
		await onChange(e.target?.value || null);
	}
</script>

<!-- Input -->
<div class="outer-container" class:error>
	<div class="inner-container">
		<input bind:value oninput={_onChange} class="input" type="text" name={htmlName} id={htmlName} {disabled} {placeholder} {...rest} />
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

	/* Input */
	.input {
		outline: none;
		background-color: var(--grey-700);
		border: 1px dashed var(--grey-500);
		font-size: var(--fs);
		line-height: var(--fs-lh);
		color: var(--grey-100);
		border-radius: 6px;
		padding: 8px 16px;
		width: 100%;
	}

	/* Input states */
	.input::placeholder {
		color: var(--grey-600);
	}

	.input:active,
	.input:focus {
		outline: none;
		border: 1px solid var(--primary-400);
		box-shadow: 0 0 10px 0 hsla(33, 78%, 57%, 0.2);
	}

	.outer-container.error .input:active {
		box-shadow: 0 0 10px 0 hsla(0, 50%, 50%, 0.2);
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
</style>

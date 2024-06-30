<script lang="ts">
	import type { HTMLFieldsetAttributes } from 'svelte/elements';
	import { setContext, type Snippet } from 'svelte';

	type Props = {
		/** Sets the label */
		label: string;
		/** Sets the labels direction @default column */
		labelDir?: 'row' | 'row-reverse' | 'column';
		/** Sets the label's "for" attribute */
		htmlName: string;
		/** Input to render inside fieldset */
		children: Snippet;
	} & HTMLFieldsetAttributes;
	let { label, labelDir = 'column', htmlName, children, ...rest }: Props = $props();

	// Sets the context for children form elements to use
	setContext('htmlName', htmlName);
</script>

<fieldset {...rest} style="--label-dir: {labelDir}; {rest.style ?? ''}" class:row={labelDir === 'row' || labelDir === 'row-reverse'}>
	<label for={htmlName}>{label}</label>
	{@render children()}
</fieldset>

<style>
	fieldset {
		border: none;
		display: flex;
		flex-direction: var(--label-dir, column);
		position: relative;
		align-items: flex-start;
		user-select: none;
		white-space: nowrap;
		gap: 6px;
	}

	label {
		color: var(--grey-300);
		font-size: var(--fs);
		line-height: var(--fs-lh);
		font-weight: 500;
	}

	fieldset.row {
		align-items: center;
	}
</style>

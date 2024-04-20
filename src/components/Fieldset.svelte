<script lang="ts">
	import { setContext, type Snippet } from 'svelte';

	type Props = {
		/** Sets the label */
		label: string;
		/** Sets the label's "for" attribute */
		htmlName: string;
		/** Input to render inside fieldset */
		children: Snippet;
	};
	let { label, htmlName, children } = $props<Props>();

	// Sets the context for children form elements to use
	setContext('htmlName', htmlName);
</script>

<fieldset>
	<label for={htmlName}>{label}</label>
	{@render children()}
</fieldset>

<style>
	fieldset {
		border: none;
		display: flex;
		position: relative;
		flex-direction: column;
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
</style>

<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		/** Sets the theme of the button @default primary */
		theme?: 'primary' | 'danger';
	} & HTMLButtonAttributes;

	let { children, theme, ...rest }: Props = $props();
</script>

<button class="btn {theme}" type="button" {...rest}>
	<span>
		{@render children()}
	</span>
</button>

<style>
	/* Styling is done in base.css because button styling applies to both Buttons/Links in some situations */
</style>

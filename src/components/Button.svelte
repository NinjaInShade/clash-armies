<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
	} & HTMLButtonAttributes;

	let { children, ...rest } = $props<Props>();
</script>

<button class="btn" {...rest}>
	<span>
		{@render children()}
	</span>
</button>

<style>
	/* Styling is done in base.css because button styling applies to both Buttons/Links in some situations */
</style>

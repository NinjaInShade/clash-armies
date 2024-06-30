<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		href: string;
	} & HTMLAnchorAttributes;

	let { children, href, ...rest }: Props = $props();
</script>

<a class="btn" {href} {...rest}>
	<span>
		{@render children()}
	</span>
</a>

<style>
	/* Styling is done in base.css because button styling applies to both Buttons/Links in some situations */
</style>

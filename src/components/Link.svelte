<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

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

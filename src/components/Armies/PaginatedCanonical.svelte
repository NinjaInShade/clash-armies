<script lang="ts">
	import { page } from '$app/state';

	type Props = {
		/** Absolute URL of the unpaginated page, e.g. "https://clasharmies.com/armies" */
		href: string;
	};
	const { href }: Props = $props();

	/**
	 * Page 2+ of the *unfiltered* list gets a self-referencing canonical so crawlers index the
	 * armies only reachable there, instead of treating every page as a duplicate of page 1.
	 *
	 * Filtered views collapse to the plain list entirely, page number included - keeping `?page=2` on a filtered
	 * view would point at a real URL holding a different set of armies, which feels worse than not paginating at all.
	 */
	const canonical = $derived.by(() => {
		const params = page.url.searchParams;
		const isFiltered = Array.from(params.keys()).some((key) => key !== 'page');
		if (isFiltered) {
			return href;
		}
		const parsed = Number(params.get('page'));
		return Number.isInteger(parsed) && parsed > 1 ? `${href}?page=${parsed}` : href;
	});
</script>

<svelte:head>
	<link rel="canonical" href={canonical} />
</svelte:head>

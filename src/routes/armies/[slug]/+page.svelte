<script lang="ts">
	import type { PageData } from './$types';
	import C from '$components';

	const { data }: { data: PageData } = $props();
	const { army } = $derived(data);
</script>

<section class="army">
	<div class="container">
		<C.ViewArmy {army} />
	</div>
</section>

<style>
	.army {
		padding: 32px var(--side-padding);
		flex: 1 0 0px;
	}

	@media (max-width: 850px) {
		.army {
			padding: 32px var(--side-padding) 24px var(--side-padding);
		}
	}
</style>

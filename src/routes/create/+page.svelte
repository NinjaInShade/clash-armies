<script lang="ts">
	import C from '~/components';
</script>

<section class="army">
	<div class="container">
		<C.EditArmy />
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

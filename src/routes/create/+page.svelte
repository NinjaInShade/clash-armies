<script lang="ts">
	import C from '$components';
</script>

<svelte:head>
	<meta
		name="description"
		content="Build your own Clash of Clans army with our simple and intuitive builder. Choose troops, spells, heroes, and write a guide to share with the community— or just plan your perfect attack."
	/>
</svelte:head>

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

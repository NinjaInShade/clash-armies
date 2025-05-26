<script lang="ts">
	import C from '$components';
</script>

<svelte:head>
	<!-- Note: title tag lives within the EditArmy component -->
	<meta
		name="description"
		content="Build your own Clash of Clans army with our simple and intuitive builder. Choose troops, spells, heroes, and write a guide to share with the community - or just plan your perfect attack."
	/>
	<link rel="canonical" href="https://clasharmies.com/army-builder" />
</svelte:head>

<section class="army">
	<div class="container">
		<C.EditArmy />
	</div>
</section>

<style>
	.army {
		padding: 24px var(--side-padding) 32px var(--side-padding);
		flex: 1 0 0px;

		@media (max-width: 500px) {
			padding: 16px var(--side-padding) 24px var(--side-padding);
		}
	}
</style>

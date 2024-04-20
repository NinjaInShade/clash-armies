<script lang="ts">
	type Props = {
		level: number;
	};
	let { level } = $props<Props>();
</script>

<img src="/clash/buildings/town-hall-{level}.png" alt="Town hall {level}" />

<style>
	img {
		display: block;
		height: 38px;
		width: auto;
	}
</style>

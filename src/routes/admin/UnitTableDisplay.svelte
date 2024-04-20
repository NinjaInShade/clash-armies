<script lang="ts">
	type Props = {
		name: string;
	};
	let { name } = $props<Props>();
</script>

<img src="/clash/units/{name}.png" alt="Unit: {name}" />

<style>
	img {
		display: block;
		height: 38px;
		width: auto;
	}
</style>

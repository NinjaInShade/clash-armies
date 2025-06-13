<script lang="ts">
	type Props = {
		name: string;
	};
	let { name }: Props = $props();
</script>

<img src="/clash/units/{name}.webp" alt="Unit: {name}" />

<style>
	img {
		display: block;
		height: 38px;
		width: auto;
	}
</style>

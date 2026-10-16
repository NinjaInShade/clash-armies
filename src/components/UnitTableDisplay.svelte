<script lang="ts">
	import { unitImgURL } from '#client/assets.ts';

	type Props = {
		name: string;
	};
	let { name }: Props = $props();
</script>

<img src={unitImgURL(name)} alt="Unit: {name}" />

<style>
	img {
		display: block;
		height: 38px;
		width: auto;
	}
</style>

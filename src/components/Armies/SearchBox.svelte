<script lang="ts">
	import Input from '../Input.svelte';

	type Props = {
		value: string | null | undefined;
		onChange: (value: string | null | undefined) => void;
	};
	const { value, onChange }: Props = $props();
</script>

<Input {value} {onChange} placeholder="Search armies" icon={searchIcon} containerClass="searchbox" --input-width="100%" />

{#snippet searchIcon()}
	<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M10.0057 8.80503H9.37336L9.14923 8.58891C9.96079 7.64759 10.4068 6.44584 10.4059 5.20297C10.4059 4.17392 10.1008 3.16798 9.52909 2.31236C8.95738 1.45673 8.14478 0.789856 7.19407 0.396055C6.24335 0.00225437 5.1972 -0.100782 4.18792 0.099976C3.17865 0.300734 2.25157 0.796269 1.52392 1.52392C0.796269 2.25157 0.300734 3.17865 0.099976 4.18792C-0.100782 5.1972 0.00225437 6.24335 0.396055 7.19407C0.789856 8.14478 1.45673 8.95738 2.31236 9.52909C3.16798 10.1008 4.17392 10.4059 5.20297 10.4059C6.49171 10.4059 7.67639 9.93368 8.58891 9.14923L8.80503 9.37336V10.0057L12.8073 14L14 12.8073L10.0057 8.80503ZM5.20297 8.80503C3.20984 8.80503 1.60092 7.19611 1.60092 5.20297C1.60092 3.20984 3.20984 1.60092 5.20297 1.60092C7.19611 1.60092 8.80503 3.20984 8.80503 5.20297C8.80503 7.19611 7.19611 8.80503 5.20297 8.80503Z"
			fill="currentColor"
		/>
	</svg>
{/snippet}

<style>
	:global(.searchbox .input) {
		border-style: dashed;
		background-color: var(--grey-850);
		height: var(--controls-height);
	}
</style>

<script lang="ts">
	import type { FetchErrors } from '$types';

	type Props = {
		/**
		 * Whether to auto scroll the errors into view when they are rendered
		 * @default true
		 */
		scrollOnErrors?: boolean;
	};
	const { errors, scrollOnErrors = true }: Props = $props();

	let containerRef = $state<HTMLUListElement | undefined>(undefined);

	$effect(() => {
		if (containerRef && scrollOnErrors && errors) {
			containerRef.scrollIntoView({ block: 'center' });
		}
	});
</script>

{#if errors}
	<ul class="errors" bind:this={containerRef}>
		{#if typeof errors === 'string'}
			<li>{errors}</li>
		{:else}
			{#each Object.entries(errors) as [field, messages]}
				{#if messages}
					{#each messages as error}
						<li>{`${field[0].toUpperCase()}${field.slice(1)}`}: <span>{error}</span></li>
					{/each}
				{/if}
			{/each}
		{/if}
	</ul>
{/if}

<style>
	.errors {
		border-radius: 4px;
		padding: 0.75em 1em;
		background-color: #3f2727;
		border: 1px solid var(--error-500);
		color: var(--grey-100);
		width: 100%;
	}
	.errors li {
		list-style: square;
		list-style-position: inside;
	}
</style>

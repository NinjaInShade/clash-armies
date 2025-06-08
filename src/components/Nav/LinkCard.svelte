<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		description: string;
		img: string | Snippet;
		imgAlt?: string;
		href: string;
		onClicked?: () => Promise<void> | void;
	};
	const { title, description, img, imgAlt, href, onClicked = () => {} }: Props = $props();
</script>

<a class="link-card" {href} onclick={onClicked}>
	<div class="img-container">
		{#if typeof img === 'string'}
			<img src={img} alt={imgAlt} />
		{:else}
			{@render img()}
		{/if}
	</div>
	<div>
		<b class="title">
			{title}
			<svg class="arrow" viewBox="0 0 10 9" xmlns="http://www.w3.org/2000/svg">
				<path d="M1 4.5H9M9 4.5L5.8 1.5M9 4.5L5.8 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</b>
		<p class="description">{description}</p>
	</div>
</a>

<style>
	.link-card {
		display: flex;
		align-items: flex-start;
		gap: 10px;

		& .title,
		& .description {
			font-size: var(--fs-sm);
			line-height: var(--fs-sm-lh);
		}

		& .title {
			display: flex;
			align-items: center;
			gap: 4px;
			font-weight: 500;
			color: var(--grey-100);

			& .arrow {
				height: 8px;
				width: auto;

				display: inline-block;
				transform: scale(0.6);
				opacity: 0;
				transition:
					transform 0.1s ease,
					opacity 0.1s ease;
				transform-origin: center;
			}
		}

		& .description {
			white-space: nowrap;
			transition: 0.1s color ease;
			color: var(--grey-400);
		}

		& .img-container {
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: var(--grey-600);
			border-radius: 2px;
			padding: 6px;
			min-width: 45px;
			min-height: 45px;
			width: 45px;
			height: 45px;

			& img {
				height: 100%;
				width: auto;
			}
		}

		&:hover {
			& .title {
				.arrow {
					transform: scale(1);
					opacity: 1;
				}
			}

			& .description {
				color: var(--grey-100);
			}
		}
	}
</style>

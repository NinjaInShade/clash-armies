<script lang="ts">
	type Props = {
		title: string;
		description: string;
		descriptionWidth?: number;
		img: string;
		imgAlt: string;
		style?: string;
	};
	const { title, description, descriptionWidth = 275, img, imgAlt, style }: Props = $props();
</script>

<header class="army-banner" {style}>
	<div class="img-container">
		<img src={img} alt={imgAlt} />
	</div>
	<div class="content">
		<h2>{title}</h2>
		<p style="max-width: {descriptionWidth}px">{@html description}</p>
	</div>
</header>

<style>
	.army-banner {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		background-image: url('/ui/cloud-overlay.webp');
		background-size: cover;
		background-blend-mode: color-burn;
		background-color: var(--grey-850);
		padding: 24px 32px;
		border-radius: 6px;
		width: 100%;
		gap: 24px;

		& .img-container {
			display: flex;
			justify-content: center;
			max-width: 75%;

			& img {
				display: block;
				max-height: 100px;
				max-width: 100%;
				height: 100%;
				width: auto;

				@media (max-width: 850px) {
					max-height: 90px;
				}

				@media (max-width: 500px) {
					max-height: 80px;
				}
			}
		}

		& .content {
			& h2 {
				font-size: 24px;
				line-height: 29px;

				@media (max-width: 500px) {
					text-align: center;
				}
			}

			& p {
				font-size: var(--fs);
				line-height: var(--fs-lh);
				color: var(--grey-100);
				font-weight: 500;
				margin-top: 4px;

				& :global(b) {
					color: var(--primary-400);
					font-weight: 700;
				}

				@media (max-width: 500px) {
					text-align: center;
				}
			}
		}

		@media (max-width: 850px) {
			padding: 24px;
			gap: 16px;
		}

		@media (max-width: 500px) {
			padding: 24px 16px;
			margin-top: 36px;
			flex-flow: column;
			gap: 8px;

			& .img-container {
				margin-top: -60px;
			}
		}
	}
</style>

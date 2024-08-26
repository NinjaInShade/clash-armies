<script lang="ts">
	type Props = {
		onClick: () => void;
	};
	const { onClick }: Props = $props();
</script>

<div class="not-added">
	<div class="guide-img-container">
		<img src="/clash/ui/bb-duel.png" alt="Clash of clans builder base two swords" />
	</div>
	<h2>Add guide</h2>
	<button class="add-guide-btn" onclick={onClick}>
		<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M15 0C11.0367 0.0480892 7.24926 1.64388 4.44657 4.44657C1.64388 7.24926 0.0480892 11.0367 0 15C0.0480892 18.9633 1.64388 22.7507 4.44657 25.5534C7.24926 28.3561 11.0367 29.9519 15 30C18.9633 29.9519 22.7507 28.3561 25.5534 25.5534C28.3561 22.7507 29.9519 18.9633 30 15C29.9519 11.0367 28.3561 7.24926 25.5534 4.44657C22.7507 1.64388 18.9633 0.0480892 15 0ZM23.5714 16.0714H16.0714V23.5714H13.9286V16.0714H6.42857V13.9286H13.9286V6.42857H16.0714V13.9286H23.5714V16.0714Z"
				fill="#5C5C5C"
			/>
		</svg>
	</button>
</div>

<style>
	.not-added {
		display: flex;
		flex-flow: column;
		align-items: center;
		justify-content: center;
		margin-top: 0;
		padding: 24px;
	}
	.not-added h2 {
		font-family: 'Poppins', sans-serif;
		font-size: var(--fs);
		line-height: var(--fs-lh);
		color: var(--grey-100);
		font-weight: bold;
		letter-spacing: 2px;
		text-transform: uppercase;
		background: none;
		border: none;
		line-height: 21px;
		max-width: 225px;
		text-align: center;
		margin: -24px 0 0 0;
		position: relative;
	}
	.not-added h2:has(+ .add-guide-btn) {
		margin-bottom: 8px;
	}
	.add-guide-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 10px;
		max-width: 100px;
		width: 100%;
		border-radius: 8px;
		border: 1px solid var(--grey-500);
	}
	.add-guide-btn,
	.add-guide-btn path {
		transition: all 0.15s ease-in-out;
	}
	.add-guide-btn:focus,
	.add-guide-btn:active {
		outline: var(--grey-400) dotted 2px;
	}
	.add-guide-btn:hover path,
	.add-guide-btn:focus path {
		fill: var(--grey-400);
	}
	.guide-img-container {
		position: relative;
		max-width: 150px;
		width: 100%;
	}
	.guide-img-container::before {
		position: absolute;
		content: '';
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(0deg, rgba(41, 41, 41, 1) 0%, rgba(41, 41, 41, 0.95) 5%, rgba(41, 41, 41, 0) 100%);
	}
	.guide-img-container img {
		max-width: 100%;
		width: 100%;
		height: auto;
	}
</style>

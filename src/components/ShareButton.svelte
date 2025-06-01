<script lang="ts">
	import { getContext } from 'svelte';
	import type { AppState } from '$types';
	import type { ArmyModel } from '$models';
	import { COPY_LINK_CLICK_METRIC } from '$shared/utils';
	import { copy } from '$client/army';

	type CAShareData = Required<Omit<ShareData, 'files'>>;

	type Props = {
		model: ArmyModel;
		size?: 'regular' | 'large';
	};
	const { model, size = 'regular' }: Props = $props();
	const app = getContext<AppState>('app');

	/**
	 * Shares link to the army on the site.
	 * Prefers native web sharing API interface if supported.
	 * Otherwise copies to clipboard.
	 */
	async function onClick() {
		try {
			const shareData = getShareData();
			if (navigator.canShare && navigator.canShare(shareData)) {
				await openShareInterface(shareData);
			} else {
				await copyToClipboard(shareData);
			}
		} catch {
			app.notify({ title: 'Failed to share', description: 'There was a problem sharing this army', theme: 'failure' });
		}
	}

	async function openShareInterface(shareData: CAShareData) {
		recordShare();

		try {
			await navigator.share(shareData);
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') {
				// Ignore
				return;
			}
			throw err;
		}
	}

	async function copyToClipboard(shareData: CAShareData) {
		recordShare();
		await copy(shareData.url);
		app.notify({ title: 'Copied army', description: 'Successfully copied army link to clipboard', theme: 'success' });
	}

	function getShareData(): CAShareData {
		const stats = model.getStats();
		const armyType = stats.type.toLowerCase();
		return {
			title: 'ClashArmies',
			text: `Master TH${model.townHall} ${armyType} strategy: ${model.name}\n`,
			url: `https://clasharmies.com/armies/${model.id}`,
		};
	}

	function recordShare() {
		app.http.post('/api/armies/metrics', { metric: COPY_LINK_CLICK_METRIC, armyId: model.id }).catch(() => {});
	}
</script>

<button class="utility-btn {size}" aria-label="Share" onclick={onClick} title="Share this army with friends!">
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 12">
		<path d="M14 5.6L8.55556 0V3.2C3.11111 4 0.777778 8 0 12C1.94444 9.2 4.66667 7.92 8.55556 7.92V11.2L14 5.6Z" fill="currentColor" />
	</svg>
</button>

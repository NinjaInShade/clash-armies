<script lang="ts">
	type Props = {
		armyId: number;
		votes: number;
		userVote: number;
		allowEdit: boolean;
		class?: string;
	};
	let { votes = $bindable(), userVote = $bindable(), armyId, allowEdit, class: _class }: Props = $props();

	let saving = $state<boolean>(false);

	async function saveVote() {
		saving = true;
		try {
			const data = { armyId: armyId, vote: userVote };
			await fetch('/create?/saveVote', { method: 'POST', body: JSON.stringify(data) });
		} finally {
			saving = false;
		}
	}
	function getClass(votes: number) {
		if (votes > 0) {
			return 'upvote';
		}
		if (votes < 0) {
			return 'downvote';
		}
		return '';
	}

	async function downvote() {
		votes -= userVote ? 2 : 1;
		userVote = -1;
		await saveVote();
	}

	async function upvote() {
		votes += userVote ? 2 : 1;
		userVote = 1;
		await saveVote();
	}

	async function clearVote() {
		votes += userVote === -1 ? 1 : -1;
		userVote = 0;
		await saveVote();
	}
</script>

<div class="vote {_class ? _class : ''}">
	<b class={getClass(votes)}>{votes}</b>
	<button onclick={userVote === -1 ? clearVote : downvote} disabled={saving || !allowEdit} class:selected={userVote === -1}>
		<svg width="16.76" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M0 0H2.9932V8.2963H0V0ZM12.5714 0H4.19048V8.77215L6.01154 11.4761L6.51739 14.9825C6.55936 15.2645 6.70211 15.5223 6.91971 15.709C7.13731 15.8957 7.41533 15.9989 7.70329 16H7.78231C8.25847 15.9995 8.715 15.8121 9.05169 15.4788C9.38839 15.1455 9.57775 14.6936 9.57823 14.2222V10.6667H14.3673C15.0022 10.6659 15.6108 10.4159 16.0597 9.97153C16.5086 9.52717 16.7611 8.92472 16.7619 8.2963V4.14815C16.7606 3.04838 16.3187 1.99401 15.5331 1.21635C14.7476 0.438694 13.6824 0.00125473 12.5714 0Z"
				fill={userVote === -1 ? '#ff6666' : 'var(--grey-300)'}
			/>
		</svg>
	</button>
	<button onclick={userVote === 1 ? clearVote : upvote} disabled={saving || !allowEdit} class:selected={userVote === 1}>
		<svg width="17.23" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M0 7.7037H3.07692V16H0V7.7037ZM12.9231 16H4.30769V7.22785L6.17969 4.52385L6.69969 1.01748C6.74284 0.735475 6.88958 0.47772 7.11327 0.291023C7.33696 0.104326 7.62276 0.00106815 7.91877 0H8C8.48948 0.000470646 8.95877 0.187923 9.30489 0.521219C9.651 0.854515 9.84567 1.30643 9.84615 1.77778V5.33333H14.7692C15.4218 5.33412 16.0475 5.5841 16.5089 6.02847C16.9704 6.47283 17.23 7.07528 17.2308 7.7037V11.8519C17.2295 12.9516 16.7752 14.006 15.9676 14.7836C15.1601 15.5613 14.0651 15.9987 12.9231 16Z"
				fill={userVote === 1 ? '#53E059' : 'var(--grey-300)'}
			/>
		</svg>
	</button>
</div>

<style>
	.vote {
		display: flex;
		align-items: center;
	}

	b {
		font-family: 'Clash', sans-serif;
		font-size: 15px;
		line-height: 15px;
		color: var(--grey-100);
		margin-right: 6px;
	}
	b.downvote {
		color: #ff6666;
	}
	b.upvote {
		color: #53e059;
	}

	button svg {
		display: block;
	}
	button path {
		transition: fill 0.1s ease-in-out;
	}
	button:not(.selected):hover path {
		fill: var(--grey-100);
	}
	button:not(:last-child) {
		margin-right: 4px;
	}
</style>

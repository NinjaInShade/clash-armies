<script lang="ts">
	import { page } from '$app/stores';

	function getMessage(diagnostics: typeof $page) {
		const status = diagnostics.status;
		const error = diagnostics.error;
		if (status === 404) {
			return "This page doesn't exist warrior!";
		}
		if (!error) {
			return 'Internal error';
		}
		return error.message;
	}
</script>

<header>
	<div class="container">
		<h1>{$page.status}!</h1>
		<p class="body">{getMessage($page)}</p>
		<a class="btn" href="/">Back to home</a>
	</div>
</header>

<style>
	header {
		padding: 100px var(--side-padding);
	}

	header .container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	header p {
		margin: 16px 0 24px 0;
	}
</style>

<script lang="ts">
	const LAST_UPDATED = '9 October 2026';
	const CONTACT_EMAIL = 'support@clasharmies.com';
</script>

<svelte:head>
	<title>ClashArmies • Privacy policy</title>
	<meta name="description" content="Learn what data Clash Armies collects, why it's collected, how it's used, and the choices you have." />
	<link rel="canonical" href="https://clasharmies.com/privacy-policy" />
</svelte:head>

<section>
	<div class="container">
		<h1>Privacy policy</h1>
		<p class="updated">Last updated: {LAST_UPDATED}</p>

		<p>
			This page explains what information Clash Armies collects when you use the site and how it's used. We don't sell your personal information or share it
			with third parties, except as described below.
		</p>

		<h2>Information we collect</h2>
		<p>
			If you sign in with Google, we store your Google account ID and email address. Your email is never shown publicly and is only used to contact you about
			your account if needed. We also store the content you create, such as your profile, armies and comments. Your profile, armies and comments are public.
		</p>
		<p>Like most websites, our server keeps basic logs, such as IP addresses and browser information, to keep the site running and prevent abuse.</p>

		<h2>Ads</h2>
		<p>
			We use Google AdSense to show ads. Google uses cookies to show ads based on your previous visits to this and other websites. You can opt out of
			personalised ads in <a href="https://adssettings.google.com" target="_blank">Google's Ads Settings</a>. We don't control which specific ads are shown.
		</p>

		<h2>Cookies</h2>
		<p>
			We use cookies to keep you signed in, remember your preferences, and understand how the site is used. Our advertising partners and embedded YouTube videos
			may also set their own cookies. You can disable cookies in your browser, but some features, such as signing in, won't work without them.
		</p>

		<h2>Your data</h2>
		<p>
			To access or delete your data, or delete your account, email us at <a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a>. We may update this policy from
			time to time, and will update the date at the top of this page when we do.
		</p>
	</div>
</section>

<style>
	section {
		display: flex;
		justify-content: center;
		padding: 50px var(--side-padding);
		flex: 1 0 0px;
	}
	section .container {
		background-color: var(--grey-800);
		color: var(--grey-100);
		border-radius: 8px;
		padding: 2em;
		max-width: 850px;
	}
	h1 {
		margin-bottom: 0.25em;
	}
	h2 {
		margin: 1.5em 0 0.5em 0;
	}
	p {
		color: var(--grey-300);
	}
	p + p {
		margin-top: 0.75em;
	}
	.updated {
		color: var(--grey-400);
		font-size: var(--fs-sm);
		line-height: var(--fs-sm-lh);
	}
	a {
		color: var(--primary-400);
		font-weight: 500;
	}
</style>

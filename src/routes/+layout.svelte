<nav>
	<div class="container">
		<a href="/">Clash <span>Armies</span></a>
		<ul>
			<li>
				<a class="body" href="/armies">Find</a>
			</li>
			<li>
				<a class="body" href="/create-army">Create</a>
			</li>
			<li>
				<a class="body" href="/account">Account</a>
			</li>
			<li>
				<button class="btn">Log in</button>
			</li>
		</ul>
	</div>
</nav>

<slot />

<style>
	nav {
		background-color: var(--grey-800);
		padding: 16px var(--side-padding);
	}

	nav .container {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	nav ul {
		display: flex;
		align-items: center;
		gap: 24px;
	}

	nav .container > a,
	nav .container > a span {
		color: var(--grey-100);
		font-family: 'Clash', sans-serif;
		font-weight: 700;
		font-size: 20px;
	}

	nav .container > a span {
		color: var(--primary-300);
	}

	nav li a {
		transition: color 0.15s ease-in-out;
		color: var(--grey-400);
	}

	nav li a:hover {
		color: var(--grey-300);
	}
</style>

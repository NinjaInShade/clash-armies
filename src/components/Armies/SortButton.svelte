<script lang="ts">
	import { SORT_OPTIONS } from './Controls.svelte';
	import Menu from '../Menu.svelte';

	type Props = {
		value: string | undefined;
		onChange: (value: string | undefined) => void;
	};
	const { value, onChange }: Props = $props();

	let menuRef = $state<HTMLButtonElement>();
	let menuOpen = $state(false);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function onClick(option: string) {
		onChange(value === option ? undefined : option);
		menuOpen = false;
	}
</script>

<!-- svelte-ignore a11y_consider_explicit_label -->
<button
	class="utility-btn regular sort-btn"
	style="--bg-clr: var(--grey-850); --bg-clr-hover: var(--grey-900); --gap: 0; --fs: 15px; --fs-weight: 500;"
	class:active={value !== undefined}
	type="button"
	bind:this={menuRef}
	onclick={toggleMenu}
>
	<svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="M8.99052 4.71102C8.80337 4.52382 8.69824 4.26996 8.69824 4.00526C8.69824 3.74056 8.80337 3.48669 8.99052 3.2995L11.9853 0.304753C12.0773 0.20941 12.1875 0.133362 12.3093 0.0810446C12.4311 0.0287274 12.5621 0.00118948 12.6946 3.76905e-05C12.8272 -0.0011141 12.9586 0.0241433 13.0813 0.074336C13.204 0.124529 13.3154 0.198652 13.4092 0.29238C13.5029 0.386108 13.577 0.497564 13.6272 0.620245C13.6774 0.742926 13.7026 0.874375 13.7015 1.00692C13.7003 1.13947 13.6728 1.27046 13.6205 1.39225C13.5682 1.51404 13.4921 1.62419 13.3968 1.71627L10.402 4.71102C10.2148 4.89816 9.96098 5.00329 9.69628 5.00329C9.43158 5.00329 9.17771 4.89816 8.99052 4.71102Z"
			fill="currentColor"
		/>
		<path
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="M16.3916 4.711C16.2044 4.89815 15.9505 5.00328 15.6858 5.00328C15.4211 5.00328 15.1672 4.89815 14.98 4.711L11.9853 1.71626C11.8035 1.52799 11.7028 1.27583 11.7051 1.01409C11.7074 0.752357 11.8124 0.501984 11.9975 0.316901C12.1825 0.131818 12.4329 0.026833 12.6947 0.0245586C12.9564 0.0222842 13.2085 0.122902 13.3968 0.304741L16.3916 3.29948C16.5787 3.48668 16.6838 3.74054 16.6838 4.00524C16.6838 4.26994 16.5787 4.52381 16.3916 4.711Z"
			fill="currentColor"
		/>
		<path
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="M12.6917 2.00877C12.9564 2.00877 13.2103 2.11395 13.3976 2.30115C13.5848 2.48836 13.6899 2.74227 13.6899 3.00702V10.993C13.6899 11.2578 13.5848 11.5117 13.3976 11.6989C13.2103 11.8861 12.9564 11.9912 12.6917 11.9912C12.4269 11.9912 12.173 11.8861 11.9858 11.6989C11.7986 11.5117 11.6934 11.2578 11.6934 10.993V3.00702C11.6934 2.74227 11.7986 2.48836 11.9858 2.30115C12.173 2.11395 12.4269 2.00877 12.6917 2.00877ZM8.40621 9.28899C8.59335 9.47619 8.69848 9.73005 8.69848 9.99475C8.69848 10.2595 8.59335 10.5133 8.40621 10.7005L5.41147 13.6953C5.2232 13.8771 4.97104 13.9777 4.7093 13.9754C4.44756 13.9732 4.19719 13.8682 4.01211 13.6831C3.82702 13.498 3.72204 13.2476 3.71976 12.9859C3.71749 12.7242 3.81811 12.472 3.99995 12.2837L6.99469 9.28899C7.18189 9.10185 7.43575 8.99672 7.70045 8.99672C7.96515 8.99672 8.21901 9.10185 8.40621 9.28899Z"
			fill="currentColor"
		/>
		<path
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="M1.00419 9.28898C1.19139 9.10184 1.44525 8.9967 1.70995 8.9967C1.97465 8.9967 2.22851 9.10184 2.41571 9.28898L5.41045 12.2837C5.50579 12.3758 5.58184 12.486 5.63416 12.6077C5.68648 12.7295 5.71401 12.8605 5.71517 12.9931C5.71632 13.1256 5.69106 13.2571 5.64087 13.3797C5.59068 13.5024 5.51655 13.6139 5.42282 13.7076C5.3291 13.8013 5.21764 13.8755 5.09496 13.9257C4.97228 13.9759 4.84083 14.0011 4.70828 14C4.57574 13.9988 4.44475 13.9713 4.32296 13.9189C4.20117 13.8666 4.09101 13.7906 3.99893 13.6952L1.00419 10.7005C0.817045 10.5133 0.711914 10.2594 0.711914 9.99474C0.711914 9.73004 0.817045 9.47618 1.00419 9.28898Z"
			fill="currentColor"
		/>
		<path
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="M4.70528 11.9912C4.44053 11.9912 4.18662 11.8861 3.99941 11.6989C3.8122 11.5117 3.70703 11.2577 3.70703 10.993V3.00702C3.70703 2.74227 3.8122 2.48836 3.99941 2.30115C4.18662 2.11395 4.44053 2.00877 4.70528 2.00877C4.97003 2.00877 5.22394 2.11395 5.41115 2.30115C5.59835 2.48836 5.70353 2.74227 5.70353 3.00702V10.993C5.70353 11.2577 5.59835 11.5117 5.41115 11.6989C5.22394 11.8861 4.97003 11.9912 4.70528 11.9912Z"
			fill="currentColor"
		/>
	</svg>
</button>

<Menu bind:open={menuOpen} elRef={menuRef} --menu-width="150px">
	<div class="ca-menu sort-menu">
		<ul class="ca-menu-list">
			{#each Object.entries(SORT_OPTIONS) as [option, label]}
				{@const isSelected = value === option}
				<li>
					<button type="button" class="item focus-grey" class:active={isSelected} onclick={() => onClick(option)}>
						{label}
						{#if isSelected}
							<svg viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M3.00044 3.99976L0.999912 2.00024L0 3L3.00044 6L8 1.00047L7.0008 0L3.00044 3.99976Z" fill="currentColor" />
							</svg>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	</div>
</Menu>

<style>
	.sort-btn {
		text-transform: none;
		color: var(--grey-400);
		width: var(--controls-height);
		height: var(--controls-height);

		&.active {
			color: hsl(33, 52%, 58%);
		}
	}

	.sort-menu {
		& li svg {
			height: 12px;
			width: auto;
		}

		& .item {
			&.active {
				color: var(--grey-100);
			}
		}
	}
</style>

<script lang="ts">
	import { getContext } from 'svelte';

	type Props = {
		/** Sets the bound value */
		value?: boolean;
		/** Sets the disabled state */
		disabled?: boolean;
		/** Sets the tooltip */
		title?: string;
		/** Sets the class */
		class?: string;
		/** Sets the style */
		style?: string;
		/** Sets the on change handler */
		onChange?: (value: boolean) => Promise<void> | void;
	};
	let { value = $bindable(), disabled, title, class: _class, style, onChange }: Props = $props();

	// Passed down from context in parent <Fieldset />
	const htmlName = getContext<string>('htmlName');

	const _onChange = async (e: Event) => {
		if (!onChange) {
			return;
		}
		const el = e.target as HTMLInputElement;
		await onChange(el?.checked);
	};
</script>

<div class="outer-container">
	<button type="button" class="inner-container {_class || ''}" tabindex="-1" {style} {title}>
		<input bind:checked={value} onchange={_onChange} class="checkbox" {disabled} name={htmlName} id={htmlName} type="checkbox" />
		{#if value}
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M12.7747 0.929001C12.9711 0.929001 13.1595 1.00702 13.2983 1.14589C13.4372 1.28476 13.5152 1.47311 13.5152 1.6695V5.85849C13.5152 5.97426 13.4881 6.08843 13.436 6.19182C13.384 6.29522 13.3084 6.38496 13.2153 6.45385L7.88522 10.3933L8.58573 11.0945C8.72455 11.2334 8.80253 11.4217 8.80253 11.6181C8.80253 11.8144 8.72455 12.0027 8.58573 12.1416L7.53867 13.1887C7.42876 13.2985 7.2871 13.3709 7.13374 13.3958C6.98038 13.4206 6.82309 13.3966 6.68413 13.3271L5.06689 12.5193L3.87321 13.7122C3.73434 13.851 3.54603 13.929 3.34968 13.929C3.15332 13.929 2.96501 13.851 2.82614 13.7122L0.73202 11.6181C0.593199 11.4792 0.515213 11.2909 0.515213 11.0945C0.515213 10.8982 0.593199 10.7099 0.73202 10.571L1.92496 9.37733L1.11708 7.76008C1.0476 7.62112 1.02359 7.46383 1.04844 7.31047C1.07329 7.15711 1.14575 7.01545 1.25555 6.90555L2.30261 5.85849C2.44148 5.71966 2.62979 5.64168 2.82614 5.64168C3.0225 5.64168 3.21081 5.71966 3.34968 5.85849L4.05093 6.559L7.99037 1.2289C8.05925 1.13585 8.149 1.06025 8.25239 1.00817C8.35579 0.956084 8.46995 0.928969 8.58573 0.929001H12.7747Z"
					fill="#fff"
				/>
			</svg>
		{/if}
	</button>
</div>

<style>
	/* Checkbox  */
	.inner-container {
		border-radius: 50%;
		position: relative;
		overflow: hidden;
		outline: none;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--grey-900);
		border: 1px solid var(--grey-700);
	}

	.inner-container,
	.checkbox {
		transition: all 0.05s ease-in-out;
		height: 25px;
		width: 25px;
	}

	.checkbox {
		position: absolute;
		cursor: pointer;
		opacity: 0;
		left: 0;
		top: 0;
	}

	/* Checkbox states */
	.inner-container:has(:global(.checkbox:active)),
	.inner-container:has(:global(.checkbox:focus)) {
		outline: none;
		border: 1px solid var(--primary-400);
	}

	.inner-container:has(:global(.checkbox:disabled)) {
		user-select: none;
		cursor: not-allowed;
		opacity: 0.5;
	}

	.checkbox:disabled {
		cursor: not-allowed;
	}

	.inner-container:has(:global(.checkbox:checked)) {
		border-color: var(--primary-500);
		background-color: var(--primary-500);
	}

	/* Spinner */

	.spinner-container {
		position: absolute;
		transform: translate(-50%, -50%);
		left: 50%;
		top: 50%;
	}
</style>

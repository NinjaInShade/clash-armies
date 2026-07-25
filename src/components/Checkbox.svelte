<script lang="ts">
	import { getContext } from 'svelte';

	type Props = {
		/** Currently selected value */
		value?: boolean;
		/** Sets the disabled state */
		disabled?: boolean;
		/** Sets the tooltip */
		title?: string;
		/** Sets the class */
		class?: string;
		/** Sets the style */
		style?: string;
		/**
		 * Sets the on change handler.
		 *
		 * If provided, the checkbox becomes "controlled" - clicking it calls this, but does not update `value` itself.
		 * The caller has to own this, so beware if using `bind:value` with this.
		 */
		onChange?: (value: boolean) => Promise<void> | void;
		/**
		 * Optional label rendered next to the checkbox.
		 * Clicking it also toggles the checkbox.
		 */
		label?: string;
	};
	let { value = $bindable(), disabled, title, class: _class, style, onChange, label }: Props = $props();

	// Passed down from context in parent <Fieldset />
	const htmlName = getContext<string>('htmlName');

	const _onClick = async (e: MouseEvent) => {
		if (disabled) {
			return;
		}
		e.preventDefault();
		const newValue = !value;
		if (onChange) {
			await onChange(newValue);
		} else {
			value = newValue;
		}
	};
</script>

<div class="outer-container">
	<label class="checkbox-option" class:disabled>
		<input checked={value} onclick={_onClick} class="checkbox" {disabled} name={htmlName} id={htmlName} type="checkbox" {title} />
		<span class="inner-container {_class || ''}" class:checked={value} {style}>
			{#if value}
				<svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M12.7747 0.929001C12.9711 0.929001 13.1595 1.00702 13.2983 1.14589C13.4372 1.28476 13.5152 1.47311 13.5152 1.6695V5.85849C13.5152 5.97426 13.4881 6.08843 13.436 6.19182C13.384 6.29522 13.3084 6.38496 13.2153 6.45385L7.88522 10.3933L8.58573 11.0945C8.72455 11.2334 8.80253 11.4217 8.80253 11.6181C8.80253 11.8144 8.72455 12.0027 8.58573 12.1416L7.53867 13.1887C7.42876 13.2985 7.2871 13.3709 7.13374 13.3958C6.98038 13.4206 6.82309 13.3966 6.68413 13.3271L5.06689 12.5193L3.87321 13.7122C3.73434 13.851 3.54603 13.929 3.34968 13.929C3.15332 13.929 2.96501 13.851 2.82614 13.7122L0.73202 11.6181C0.593199 11.4792 0.515213 11.2909 0.515213 11.0945C0.515213 10.8982 0.593199 10.7099 0.73202 10.571L1.92496 9.37733L1.11708 7.76008C1.0476 7.62112 1.02359 7.46383 1.04844 7.31047C1.07329 7.15711 1.14575 7.01545 1.25555 6.90555L2.30261 5.85849C2.44148 5.71966 2.62979 5.64168 2.82614 5.64168C3.0225 5.64168 3.21081 5.71966 3.34968 5.85849L4.05093 6.559L7.99037 1.2289C8.05925 1.13585 8.149 1.06025 8.25239 1.00817C8.35579 0.956084 8.46995 0.928969 8.58573 0.929001H12.7747Z"
						fill="#fff"
					/>
				</svg>
			{/if}
		</span>
		{#if label}
			<span class="checkbox-label">{label}</span>
		{/if}
	</label>
</div>

<style>
	.checkbox-option {
		position: relative;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 6px;
		cursor: pointer;
		user-select: none;

		&.disabled {
			cursor: not-allowed;
		}
	}

	.checkbox-label {
		font-size: var(--fs);
		line-height: var(--fs-lh);
		color: var(--grey-300);
	}

	/* Checkbox  */
	.inner-container {
		border-radius: 50%;
		position: relative;
		overflow: hidden;
		outline: none;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--grey-850);
		border: 1px dashed var(--grey-500);
		transition: all 0.05s ease-in-out;
		height: 22px;
		width: 22px;
	}

	/*
	    Covers the whole control (circle/gap/text) not just the
		circle,so clicking anywhere reliably hits the real input
	*/
	.checkbox {
		position: absolute;
		cursor: pointer;
		inset: 0;
		opacity: 0;
		margin: 0;
	}

	/* Checkbox states */
	.checkbox:active + .inner-container,
	.checkbox:focus + .inner-container,
	.checkbox-option:not(:has(.inner-container.checked)):not(:has(.checkbox:disabled)):hover .inner-container {
		outline: none;
		border: 1px dashed var(--primary-400);
	}

	.checkbox:disabled {
		cursor: not-allowed;

		+ .inner-container {
			user-select: none;
			cursor: not-allowed;
			opacity: 0.5;
		}
	}

	.inner-container.checked {
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

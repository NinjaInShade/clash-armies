<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = {
		/** Sets the bound value */
		value: boolean | null;
		/** Sets the label text to the left of the switch, when it is toggled off */
		offText: string;
		/** Sets the label text to the right of the switch, when it is toggled on */
		onText: string;
		/** Sets the label's "for" attribute */
		htmlName: string;
		/** Sets the style for the labels */
		labelStyle?: string;
		/** Callback for when the switch is toggled */
		onToggle?: (checked: boolean) => Promise<void> | void;
	} & HTMLInputAttributes;

	let { value, offText, onText, onToggle, htmlName, labelStyle = '', ...rest }: Props = $props();

	let checkbox: HTMLInputElement;

	function toggle(ev: Event) {
		if (checkbox && ev.key === 'Enter') {
			checkbox.click();
		}
	}

	async function onChange(e: Event) {
		if (onToggle) {
			const el = e.target as HTMLInputElement;
			await onToggle(el.checked);
		}
	}

	function toggleOff(ev: Event) {
		ev.preventDefault();
		value = false;
	}

	function toggleOn(ev: Event) {
		ev.preventDefault();
		value = true;
	}
</script>

<fieldset>
	<label for={htmlName} style={labelStyle} class="label-off" onclick={toggleOff}>{offText}</label>
	<input bind:this={checkbox} bind:checked={value} onkeydown={toggle} onchange={onChange} name={htmlName} id={htmlName} type="checkbox" {...rest} />
	<label for={htmlName} style={labelStyle} class="label-on" onclick={toggleOn}>{onText}</label>
</fieldset>

<style>
	fieldset {
		border: none;
		display: flex;
		position: relative;
		align-items: center;
		user-select: none;
		white-space: nowrap;
		gap: 8px;
	}

	label {
		color: var(--grey-100);
		font-size: var(--fs);
		line-height: var(--fs-lh);
		font-weight: 500;
	}

	input:active,
	input:focus {
		outline: none;
		border: 1px solid var(--primary-400);
	}

	input {
		--w: 3em;
		--h: 1.5em;

		width: var(--w);
		height: var(--h);
		padding: calc(var(--h) / 6);
		border: 1px solid transparent;
		border-radius: 50px;

		box-sizing: content-box;
		aspect-ratio: 2;

		background:
			radial-gradient(farthest-side, var(--primary-400) 100%, #0000) left / var(--h) 100% content-box no-repeat,
			var(--grey-550);

		transition: 0.2s;
		cursor: pointer;
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
	}

	input:checked {
		background:
			radial-gradient(farthest-side, var(--grey-100) 100%, #0000) left / var(--h) 100% content-box no-repeat,
			var(--grey-550);

		background-position: right;
		background-color: var(--primary-400);
	}
</style>

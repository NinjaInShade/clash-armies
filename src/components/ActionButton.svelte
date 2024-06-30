<script lang="ts">
    import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		/** Sets the theme of the button @default primary */
		theme?: 'primary' | 'success';
        /** Whether to style as a ghost button (no background and a border) */
        ghost?: boolean;
        asLink?: boolean;
        class?: string;
	} & (HTMLButtonAttributes | HTMLAnchorAttributes);

	let { children, theme = 'primary', ghost, asLink, class: _class, ...rest }: Props = $props();
</script>

{#if asLink}
    <a class='action-btn {theme} {_class ? _class : ''}' class:ghost type='button' {...rest}>
        {@render children()}
    </a>
{:else}
    <button class='action-btn {theme} {_class ? _class : ''}' class:ghost type='button' {...rest}>
        {@render children()}
    </button>
{/if}

<style>
    .action-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 14px;
        line-height: 14px;
        font-weight: 500;
        padding: 6px 8px;
        border-radius: 4px;
        transition: background-color 0.15 ease-in-out;
        white-space: nowrap;
    }

    /* Regular */
    .action-btn.success {
        background-color: #424C38;
        color: #53E059;
    }
    .action-btn.success :global(svg path) {
        fill: #53E059;
    }
    .action-btn.success:hover {
        background-color: #384130;
    }
    /* Ghost */
    .action-btn.success.ghost {
        background: none;
        border: 1px dashed #759257;
        color: #759257;
    }
    .action-btn.success.ghost :global(svg path) {
        fill: #759257;
    }
    .action-btn.success.ghost:hover {
        background-color: #20211e;
    }
</style>

<script lang="ts">
    import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		/** Sets the theme of the button @default primary */
		theme?: 'primary' | 'primary-dark' | 'success' | 'danger';
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
        transition: background 0.15 ease-in-out;
        white-space: nowrap;
    }

    /* Regular */
    .action-btn.primary {
        background-color: #806039;
        color: #F3E7D8;
    }
    .action-btn.primary :global(svg path) {
        fill: #F3E7D8;
    }
    .action-btn.primary:hover {
        background-color: hsl(33, 38%, 32%);
    }
	.action-btn.primary-dark {
		background-color: hsl(33, 15%, 26%);
		color: #e0a153;
	}
	.action-btn.primary-dark :global(svg path) {
		fill: #e0a153;
	}
	.action-btn.primary-dark:hover {
		background-color: hsl(33, 15%, 22%);
	}
    .action-btn.success {
        background-color: #424C38;
        color: #53E059;
    }
    .action-btn.success:focus {
        outline: #53E059 dotted 2px;
    }
    .action-btn.success :global(svg path) {
        fill: #53E059;
    }
    .action-btn.success:hover {
        background-color: #384130;
    }
	.action-btn.danger {
		background-color: #4c3838;
		color: #e05353;
	}
	.action-btn.danger:focus {
		outline: #e05353 dotted 2px;
	}
	.action-btn.danger :global(svg path) {
		fill: #e05353;
	}
	.action-btn.danger:hover {
		background-color: #413030;
	}
    /* Ghost */
    .action-btn.primary.ghost {
        background: none;
        border: 1px dashed #CB995B;
        color: #CB995B;
    }
    .action-btn.primary.ghost :global(svg path) {
        fill: #CB995B;
    }
    .action-btn.primary.ghost:hover {
        background-color: #463c2e;
    }
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

    @media(max-width: 850px) {
        .action-btn {
            padding: 8px;
        }
    }
</style>

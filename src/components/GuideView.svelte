<script lang="ts">
	import '$assets/css/guide.css';

	type Props = {
		text: string;
	};
	const { text }: Props = $props();
</script>

<!--
	Renders guide content as plain HTML, without loading the entire editor, minimising page bundle size.

	NOTE: `text` is already sanitised: saving a guide sanitises it via TipTap's schema (generateJSON->generateHTML)
	before it reaches the database, so it is schema-validated HTML, not just arbitrary user input.
-->
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
<div class="tiptap">{@html text}</div>

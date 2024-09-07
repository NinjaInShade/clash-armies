<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import { getExtensions } from '$shared/guideEditor';
	import C from '$components';

	type Props = {
		text: string | null;
		mode: 'view' | 'edit';
		charLimit?: number;
	};
	let { text = $bindable(), charLimit, mode = 'edit' }: Props = $props();

	let editorRef = $state<HTMLDivElement | undefined>();
	let editor = $state<Editor | undefined>();

	const editable = $derived(mode === 'edit');

	// Have to declare and assign onTransaction as re-assigning editor for reactivity doesn't work like it did in svelte 4
	let h1Active = $state(false);
	let h2Active = $state(false);
	let h3Active = $state(false);
	let alignLeftActive = $state(false);
	let alignCenterActive = $state(false);
	let alignRightActive = $state(false);
	let boldActive = $state(false);
	let italicActive = $state(false);
	let strikeActive = $state(false);
	let bulletListActive = $state(false);
	let orderedListActive = $state(false);
	let linkActive = $state(false);

	let canUndo = $state(false);
	let canRedo = $state(false);

	let charsUsed = $state(0);
	let wordsUsed = $state(0);
	let charLimitPercentage = $state(0);

	let linkInput = $state<string | null>(null);
	let linkMenuOpen = $state(false);
	let linkRef = $state<HTMLButtonElement | undefined>();

	const editorExtensions = getExtensions({
		addLinkCb: () => {
			linkMenuOpen = !linkMenuOpen;
			return true;
		},
		removeLinkCb: () => {
			unsetLink();
			return true;
		},
	});

	$effect(() => {
		if (editor) return;
		editor = new Editor({
			element: editorRef,
			extensions: editorExtensions,
			content: text,
			editable,
			onUpdate({ editor }) {
				// If raw text isn't checked, you could never "clear" the text back to null
				// As an empty editor is returned as <p></p> from getHTML() which is not blank/undefined
				const rawText = editor.getText().trim();
				if (!rawText?.length) {
					text = null;
				} else {
					text = editor.getHTML();
				}
			},
			onTransaction() {
				updateActiveStates();
			},
		});
	});

	onDestroy(() => {
		if (!editor) return;
		editor.destroy();
	});

	export function getJSON() {
		return requireEditor().getJSON();
	}

	function requireEditor() {
		if (!editor) throw new Error('Expected editor instance');
		return editor;
	}

	function updateActiveStates() {
		if (!editor) return;
		h1Active = editor.isActive('heading', { level: 1 });
		h2Active = editor.isActive('heading', { level: 2 });
		h3Active = editor.isActive('heading', { level: 3 });
		alignLeftActive = editor.isActive({ textAlign: 'left' });
		alignCenterActive = editor.isActive({ textAlign: 'center' });
		alignRightActive = editor.isActive({ textAlign: 'right' });
		boldActive = editor.isActive('bold');
		italicActive = editor.isActive('italic');
		strikeActive = editor.isActive('strike');
		bulletListActive = editor.isActive('bulletList');
		orderedListActive = editor.isActive('orderedList');
		linkActive = editor.isActive('link');
		canUndo = editor.can().undo();
		canRedo = editor.can().redo();
		if (charLimit !== undefined) {
			charsUsed = editor.storage.characterCount.characters();
			wordsUsed = editor.storage.characterCount.words();
			charLimitPercentage = Math.round((100 / charLimit) * charsUsed);
		}
	}

	function toggleHeading(heading: 1 | 2 | 3) {
		requireEditor().chain().focus().toggleHeading({ level: heading }).run();
	}
	function undo() {
		requireEditor().chain().focus().undo().run();
	}
	function redo() {
		requireEditor().chain().focus().redo().run();
	}
	function align(to: 'left' | 'center' | 'right') {
		requireEditor().chain().focus().setTextAlign(to).run();
	}
	function toggleBold() {
		requireEditor().chain().focus().toggleBold().run();
	}
	function toggleItalic() {
		requireEditor().chain().focus().toggleItalic().run();
	}
	function addHr() {
		requireEditor().chain().focus().setHorizontalRule().run();
	}
	function toggleStrike() {
		requireEditor().chain().focus().toggleStrike().run();
	}
	function toggleBulletList() {
		requireEditor().chain().focus().toggleBulletList().run();
	}
	function toggleOrderedList() {
		requireEditor().chain().focus().toggleOrderedList().run();
	}
	function toggleLinkMenu() {
		linkInput = requireEditor().getAttributes('link').href;
		linkMenuOpen = !linkMenuOpen;
	}
	async function setLink() {
		if (!linkInput || !linkInput.length) {
			unsetLink();
		} else {
			requireEditor().chain().focus().extendMarkRange('link').setLink({ href: linkInput }).run();
		}
		linkMenuOpen = false;
		linkInput = null;
	}
	function unsetLink() {
		requireEditor().chain().focus().unsetLink().run();
	}
</script>

{#if editable && editor}
	<div class="controls">
		<div class="controls-group">
			<button onclick={toggleBold} class:active={boldActive} class="focus-grey" title="Ctrl+B">
				<svg width="9" height="11" viewBox="0 0 9 11" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M0.414307 11V0H4.75538C5.60657 0 6.39228 0.261905 7.11252 0.785714C7.83276 1.30952 8.19288 2.03631 8.19288 2.96607C8.19288 3.63393 8.04228 4.14805 7.74109 4.50843C7.4399 4.86881 7.15835 5.12731 6.89645 5.28393C7.22383 5.42798 7.58735 5.69643 7.98702 6.08929C8.38669 6.48214 8.58626 7.07143 8.58574 7.85714C8.58574 9.02262 8.16014 9.83793 7.30895 10.3031C6.45776 10.7682 5.65895 11.0005 4.91252 11H0.414307ZM2.79109 8.8H4.83395C5.46252 8.8 5.84569 8.63971 5.98345 8.31914C6.12121 7.99857 6.18983 7.766 6.18931 7.62143C6.18878 7.47686 6.12016 7.24455 5.98345 6.9245C5.84673 6.60445 5.44393 6.4439 4.77502 6.44286H2.79109V8.8ZM2.79109 4.32143H4.61788C5.05002 4.32143 5.36431 4.21012 5.56074 3.9875C5.75716 3.76488 5.85538 3.51607 5.85538 3.24107C5.85538 2.92679 5.74407 2.67143 5.52145 2.475C5.29883 2.27857 5.01073 2.18036 4.65716 2.18036H2.79109V4.32143Z"
						fill="#E1E1E1"
					/>
				</svg>
			</button>
			<button onclick={toggleItalic} class:active={italicActive} class="focus-grey" title="Ctrl+I">
				<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M0.928589 12.5V10.3571H4.35716L6.92859 2.64286H3.50002V0.5H12.0714V2.64286H9.07145L6.50002 10.3571H9.50002V12.5H0.928589Z" fill="#E1E1E1" />
				</svg>
			</button>
			<button onclick={toggleStrike} class:active={strikeActive} class="focus-grey" title="Ctrl+Shift+S">
				<svg width="17" height="13" viewBox="0 0 17 13" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M0.375 8.125V6.5H16.625V8.125H0.375ZM7.28125 4.875V2.4375H2.8125V0H14.1875V2.4375H9.71875V4.875H7.28125ZM7.28125 13V9.75H9.71875V13H7.28125Z"
						fill="#E1E1E1"
					/>
				</svg>
			</button>
		</div>
		<div class="separator"></div>
		<div class="controls-group">
			<button onclick={() => toggleHeading(1)} class:active={h1Active} class="focus-grey" title="Ctrl+Alt+1">
				<svg width="15" height="11" viewBox="0 0 15 11" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M0.5 10.5V0.5H2.5V4.5H6.5V0.5H8.5V10.5H6.5V6.5H2.5V10.5H0.5ZM12.5 10.5V2.5H10.5V0.5H14.5V10.5H12.5Z" fill="#E1E1E1" />
				</svg>
			</button>
			<button onclick={() => toggleHeading(2)} class:active={h2Active} class="focus-grey" title="Ctrl+Alt+2">
				<svg width="15" height="9" viewBox="0 0 15 9" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M0.5 8.3891V0.611328H2.05556V3.72244H5.16667V0.611328H6.72222V8.3891H5.16667V5.27799H2.05556V8.3891H0.5ZM8.27778 8.3891V5.27799C8.27778 4.85022 8.43022 4.48414 8.73511 4.17977C9.04 3.8754 9.40607 3.72296 9.83333 3.72244H12.9444V2.16688H8.27778V0.611328H12.9444C13.3722 0.611328 13.7386 0.763772 14.0434 1.06866C14.3483 1.37355 14.5005 1.73962 14.5 2.16688V3.72244C14.5 4.15022 14.3478 4.51655 14.0434 4.82144C13.7391 5.12633 13.3727 5.27851 12.9444 5.27799H9.83333V6.83355H14.5V8.3891H8.27778Z"
						fill="#E1E1E1"
					/>
				</svg>
			</button>
			<button onclick={() => toggleHeading(3)} class:active={h3Active} class="focus-grey" title="Ctrl+Alt+3">
				<svg width="15" height="9" viewBox="0 0 15 9" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M0.5 8.3891V0.611328H2.05556V3.72244H5.16667V0.611328H6.72222V8.3891H5.16667V5.27799H2.05556V8.3891H0.5ZM8.27778 8.3891V6.83355H12.9444V5.27799H9.83333V3.72244H12.9444V2.16688H8.27778V0.611328H12.9444C13.3722 0.611328 13.7386 0.763772 14.0434 1.06866C14.3483 1.37355 14.5005 1.73962 14.5 2.16688V6.83355C14.5 7.26133 14.3478 7.62766 14.0434 7.93255C13.7391 8.23744 13.3727 8.38962 12.9444 8.3891H8.27778Z"
						fill="#E1E1E1"
					/>
				</svg>
			</button>
		</div>
		<div class="separator"></div>
		<div class="controls-group">
			<button onclick={() => align('left')} class:active={alignLeftActive} class="focus-grey" title="Ctrl+Shift+L">
				<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M0 13V11.5556H13V13H0ZM0 10.1111V8.66667H8.66667V10.1111H0ZM0 7.22222V5.77778H13V7.22222H0ZM0 4.33333V2.88889H8.66667V4.33333H0ZM0 1.44444V0H13V1.44444H0Z"
						fill="#E1E1E1"
					/>
				</svg>
			</button>
			<button onclick={() => align('center')} class:active={alignCenterActive} class="focus-grey" title="Ctrl+Shift+E">
				<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M0 13V11.5556H13V13H0ZM2.88889 10.1111V8.66667H10.1111V10.1111H2.88889ZM0 7.22222V5.77778H13V7.22222H0ZM2.88889 4.33333V2.88889H10.1111V4.33333H2.88889ZM0 1.44444V0H13V1.44444H0Z"
						fill="#E1E1E1"
					/>
				</svg>
			</button>
			<button onclick={() => align('right')} class:active={alignRightActive} class="focus-grey" title="Ctrl+Shift+R">
				<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M0 1.44444V0H13V1.44444H0ZM4.33333 4.33333V2.88889H13V4.33333H4.33333ZM0 7.22222V5.77778H13V7.22222H0ZM4.33333 10.1111V8.66667H13V10.1111H4.33333ZM0 13V11.5556H13V13H0Z"
						fill="#E1E1E1"
					/>
				</svg>
			</button>
		</div>
		<div class="separator"></div>
		<div class="controls-group">
			<button onclick={toggleBulletList} class:active={bulletListActive} class="focus-grey" title="Ctrl+Shift+8">
				<svg width="15" height="13" viewBox="0 0 15 13" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M5.24999 11.75V10.25H14.25V11.75H5.24999ZM5.24999 7.24999V5.74999H14.25V7.24999H5.24999ZM5.24999 2.75V1.25H14.25V2.75H5.24999ZM2.25 12.5C1.8375 12.5 1.4845 12.3532 1.191 12.0597C0.897501 11.7662 0.750501 11.413 0.750001 11C0.749501 10.587 0.896501 10.234 1.191 9.94098C1.4855 9.64798 1.8385 9.50099 2.25 9.49999C2.6615 9.49899 3.01475 9.64598 3.30975 9.94098C3.60474 10.236 3.75149 10.589 3.74999 11C3.74849 11.411 3.60174 11.7642 3.30975 12.0597C3.01775 12.3552 2.6645 12.502 2.25 12.5ZM2.25 7.99999C1.8375 7.99999 1.4845 7.85324 1.191 7.55974C0.897501 7.26624 0.750501 6.91299 0.750001 6.49999C0.749501 6.08699 0.896501 5.73399 1.191 5.44099C1.4855 5.148 1.8385 5.001 2.25 5C2.6615 4.999 3.01475 5.146 3.30975 5.44099C3.60474 5.73599 3.75149 6.08899 3.74999 6.49999C3.74849 6.91099 3.60174 7.26424 3.30975 7.55974C3.01775 7.85524 2.6645 8.00199 2.25 7.99999ZM2.25 3.5C1.8375 3.5 1.4845 3.35325 1.191 3.05975C0.897501 2.76625 0.750501 2.413 0.750001 2C0.749501 1.587 0.896501 1.234 1.191 0.941004C1.4855 0.648005 1.8385 0.501005 2.25 0.500005C2.6615 0.499005 3.01475 0.646005 3.30975 0.941004C3.60474 1.236 3.75149 1.589 3.74999 2C3.74849 2.411 3.60174 2.76425 3.30975 3.05975C3.01775 3.35525 2.6645 3.502 2.25 3.5Z"
						fill="#E1E1E1"
					/>
				</svg>
			</button>
			<button onclick={toggleOrderedList} class:active={orderedListActive} class="focus-grey" title="Ctrl+Shift+7">
				<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M0.75 15V13.875H2.625V13.3125H1.5V12.1875H2.625V11.625H0.75V10.5H3C3.2125 10.5 3.39075 10.572 3.53475 10.716C3.67875 10.86 3.7505 11.038 3.75 11.25V12C3.75 12.2125 3.678 12.3907 3.534 12.5347C3.39 12.6787 3.212 12.7505 3 12.75C3.2125 12.75 3.39075 12.822 3.53475 12.966C3.67875 13.11 3.7505 13.288 3.75 13.5V14.25C3.75 14.4625 3.678 14.6407 3.534 14.7847C3.39 14.9287 3.212 15.0005 3 15H0.75ZM0.75 9.75V7.6875C0.75 7.475 0.822 7.297 0.966 7.1535C1.11 7.01 1.288 6.938 1.5 6.9375H2.625V6.375H0.75V5.25H3C3.2125 5.25 3.39075 5.322 3.53475 5.466C3.67875 5.61 3.7505 5.788 3.75 6V7.3125C3.75 7.525 3.678 7.70325 3.534 7.84725C3.39 7.99125 3.212 8.063 3 8.0625H1.875V8.625H3.75V9.75H0.75ZM1.875 4.5V1.125H0.75V0H3V4.5H1.875ZM5.25 12.75V11.25H14.25V12.75H5.25ZM5.25 8.25V6.75H14.25V8.25H5.25ZM5.25 3.75V2.25H14.25V3.75H5.25Z"
						fill="#E1E1E1"
					/>
				</svg>
			</button>
			<button onclick={addHr} class="focus-grey">
				<svg width="15" height="3" viewBox="0 0 15 3" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M11.75 1.5H14.25M6.25 1.5H8.75M0.75 1.5H3.25" stroke="#E1E1E1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>
		</div>
		<div class="separator"></div>
		<div class="controls-group">
			<button onclick={toggleLinkMenu} class="focus-grey" title="Ctrl+K" bind:this={linkRef}>
				<svg width="17" height="9" viewBox="0 0 17 9" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M7.7 8.5H4.5C3.39333 8.5 2.45013 8.10986 1.6704 7.3296C0.890667 6.54933 0.500534 5.60613 0.500001 4.5C0.499467 3.39387 0.8896 2.45067 1.6704 1.6704C2.4512 0.890133 3.3944 0.5 4.5 0.5H7.7V2.1H4.5C3.83333 2.1 3.26667 2.33333 2.8 2.8C2.33333 3.26667 2.1 3.83333 2.1 4.5C2.1 5.16667 2.33333 5.73333 2.8 6.2C3.26667 6.66666 3.83333 6.9 4.5 6.9H7.7V8.5ZM5.3 5.3V3.7H11.7V5.3H5.3ZM9.3 8.5V6.9H12.5C13.1667 6.9 13.7333 6.66666 14.2 6.2C14.6667 5.73333 14.9 5.16667 14.9 4.5C14.9 3.83333 14.6667 3.26667 14.2 2.8C13.7333 2.33333 13.1667 2.1 12.5 2.1H9.3V0.5H12.5C13.6067 0.5 14.5501 0.890133 15.3304 1.6704C16.1107 2.45067 16.5005 3.39387 16.5 4.5C16.4995 5.60613 16.1093 6.5496 15.3296 7.3304C14.5499 8.1112 13.6067 8.50106 12.5 8.5H9.3Z"
						fill="#E1E1E1"
					/>
				</svg>
			</button>
			<button onclick={unsetLink} class="focus-grey" title="Ctrl+Shift+K" disabled={!linkActive}>
				<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M14.5247 11.4925L13.3277 10.2557C13.8597 10.1094 14.292 9.82661 14.6244 9.4074C14.9569 8.98819 15.1232 8.49957 15.1232 7.94151C15.1232 7.27653 14.8904 6.71129 14.425 6.2458C13.9595 5.78032 13.3942 5.54757 12.7292 5.54757H9.53733V3.95161H12.7292C13.8331 3.95161 14.7742 4.34076 15.5525 5.11906C16.3308 5.89735 16.7197 6.83817 16.7191 7.94151C16.7191 8.69959 16.5231 9.39782 16.131 10.0362C15.739 10.6746 15.2035 11.16 14.5247 11.4925ZM11.8116 8.73949L10.2156 7.14353H11.9313V8.73949H11.8116ZM14.9636 16.4001L0.280762 1.71727L1.39793 0.600098L16.0808 15.2829L14.9636 16.4001ZM7.94137 11.9314H4.74945C3.64558 11.9314 2.70476 11.5423 1.92699 10.764C1.14923 9.98567 0.760082 9.04485 0.75955 7.94151C0.75955 7.02383 1.03884 6.20591 1.59743 5.48772C2.15601 4.76954 2.8742 4.2974 3.75197 4.07131L5.22824 5.54757H4.74945C4.08447 5.54757 3.51923 5.78032 3.05374 6.2458C2.58825 6.71129 2.35551 7.27653 2.35551 7.94151C2.35551 8.60649 2.58825 9.17173 3.05374 9.63722C3.51923 10.1027 4.08447 10.3355 4.74945 10.3355H7.94137V11.9314ZM5.54743 8.73949V7.14353H6.84415L8.42016 8.73949H5.54743Z"
						fill="#E1E1E1"
					/>
				</svg>
			</button>
			<C.Menu bind:open={linkMenuOpen} elRef={linkRef} onClose={setLink}>
				<C.FocusTrap>
					<div class="menu">
						<C.Input bind:value={linkInput} onkeydown={(ev) => ev.key === 'Enter' && setLink()} placeholder="https://example.com" />
						<C.ActionButton onclick={setLink} theme="grey">Set</C.ActionButton>
					</div>
				</C.FocusTrap>
			</C.Menu>
		</div>
		<div class="separator"></div>
		<div class="controls-group">
			<button onclick={undo} class="focus-grey" title="Ctrl+Z" disabled={!canUndo}>
				<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M2.49998 12.5V10.9H8.17998C9.01998 10.9 9.75011 10.6333 10.3704 10.1C10.9906 9.56667 11.3005 8.9 11.3 8.1C11.2994 7.3 10.9896 6.63333 10.3704 6.1C9.75118 5.56667 9.02104 5.3 8.17998 5.3H3.13998L5.21998 7.38L4.09998 8.5L0.0999756 4.5L4.09998 0.5L5.21998 1.62L3.13998 3.7H8.17998C9.47331 3.7 10.5834 4.12 11.5104 4.96C12.4373 5.8 12.9005 6.84667 12.9 8.1C12.8994 9.35333 12.4362 10.4 11.5104 11.24C10.5845 12.08 9.47438 12.5 8.17998 12.5H2.49998Z"
						fill="#E1E1E1"
					/>
				</svg>
			</button>
			<button onclick={redo} class="focus-grey" title="Ctrl+Y" disabled={!canRedo}>
				<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M4.81998 12.5C3.52664 12.5 2.41651 12.08 1.48958 11.24C0.562643 10.4 0.0994427 9.35333 0.099976 8.1C0.100509 6.84667 0.563976 5.8 1.49038 4.96C2.41678 4.12 3.52664 3.7 4.81998 3.7H9.85998L7.77998 1.62L8.89998 0.5L12.9 4.5L8.89998 8.5L7.77998 7.38L9.85998 5.3H4.81998C3.97998 5.3 3.24984 5.56667 2.62958 6.1C2.00931 6.63333 1.69944 7.3 1.69998 8.1C1.70051 8.9 2.01064 9.56667 2.63038 10.1C3.25011 10.6333 3.97998 10.9 4.81998 10.9H10.5V12.5H4.81998Z"
						fill="#E1E1E1"
					/>
				</svg>
			</button>
		</div>
	</div>
{/if}

<div class="editor-container" class:editable>
	<div bind:this={editorRef}></div>

	{#if editable && editor && charLimit !== undefined}
		<div class="char-count" class:warn={charsUsed === charLimit}>
			<svg height="20" width="20" viewBox="0 0 20 20">
				<circle r="10" cx="10" cy="10" fill="var(--grey-500)" />
				<circle
					r="5"
					cx="10"
					cy="10"
					fill="transparent"
					stroke="currentColor"
					stroke-width="10"
					stroke-dasharray="calc({charLimitPercentage} * 31.4 / 100) 31.4"
					transform="rotate(-90) translate(-20)"
				/>
				<circle r="6" cx="10" cy="10" fill="var(--grey-600)" />
			</svg>
			{charsUsed} / {charLimit} characters
			<br />
			{wordsUsed} words
		</div>
	{/if}
</div>

<style>
	.controls {
		display: flex;
		flex-flow: row wrap;
		gap: 10px;
		padding-bottom: 8px;
		margin-bottom: 16px;
		border-bottom: 1px solid var(--grey-550);
	}
	.controls-group {
		display: flex;
		flex-flow: row wrap;
		gap: 6px;
	}
	.separator {
		background-color: var(--grey-600);
		width: 1px;
	}
	.controls button {
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--grey-600);
		color: var(--grey-100);
		border-radius: 2px;
		width: 25px;
		height: 25px;
	}
	.controls button.active {
		background-color: hsl(33, 15%, 26%);
		color: #e0a153;
	}
	.controls button.active svg path {
		fill: #e0a153;
	}

	.editor-container {
		position: relative;
		border-radius: 6px;
	}
	.editor-container.editable {
		background-color: var(--grey-600);
		padding: 1em;
	}
	:global(.tiptap) {
		outline: none;
		font-size: var(--fs);
		line-height: var(--fs-lh);
		color: var(--grey-100);
		min-height: var(--editor-min-height, min(25vh, 400px));
	}
	:global(.tiptap p.is-editor-empty:first-child::before) {
		color: var(--grey-400);
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}
	:global(.tiptap:first-child) {
		margin-top: 0;
	}
	:global(.tiptap h1) {
		font-size: var(--h1-guide);
		line-height: var(--h1-guide-lh);
	}
	:global(.tiptap hr) {
		border: none;
		border-top: 1px solid var(--grey-500);
		cursor: pointer;
		margin: 1rem 0;
	}
	:global(.tiptap hr.ProseMirror-selectednode) {
		border-top: 1px solid var(--primary-400);
	}
	:global(.tiptap ul),
	:global(.tiptap ol) {
		padding: 0 1em;
	}
	:global(.tiptap ul li) {
		list-style: disc;
	}
	:global(.tiptap ol li) {
		list-style: decimal;
	}
	:global(.tiptap a) {
		color: var(--primary-400);
		text-decoration: underline;
	}
	:global(.tiptap img.ProseMirror-selectednode) {
		outline: 1px solid var(--primary-400);
	}
	:global(.tiptap .ProseMirror-gapcursor:after) {
		top: 6px;
		border-top: 1px solid var(--grey-100);
	}
	.char-count {
		display: flex;
		align-items: center;
		color: var(--grey-400);
		margin-top: 2em;
		font-size: 0.75em;
		gap: 0.5em;
	}
	.char-count svg {
		color: var(--primary-400);
	}
	.char-count.warn,
	.char-count.warn svg {
		color: var(--error-400);
	}

	.menu {
		box-shadow: 2px 8px 10px 6px hsla(0, 0%, 0%, 0.4);
		background-color: var(--grey-800);
		border: 1px solid var(--grey-550);
		border-radius: 6px;
		display: flex;
		padding: 0.5em;
		font-size: 0.65em;
		gap: 6px;
	}
	.menu :global(.input) {
		font-size: 14px;
		line-height: 14px;
		padding: 4px 10px;
	}
</style>

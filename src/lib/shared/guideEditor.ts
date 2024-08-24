import { GUIDE_TEXT_CHAR_LIMIT } from './utils';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Heading from '@tiptap/extension-heading';
import History from '@tiptap/extension-history';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import CharacterCount from '@tiptap/extension-character-count';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Strike from '@tiptap/extension-strike';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import ListKeymap from '@tiptap/extension-list-keymap';
import Dropcursor from '@tiptap/extension-dropcursor';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Link from '@tiptap/extension-link';
import Gapcursor from '@tiptap/extension-gapcursor';
import { generateJSON, generateHTML } from '@tiptap/html';
import { EditorState } from '@tiptap/pm/state';
import { getSchema } from '@tiptap/core';

type GetEditorExtensionsOpts = {
	addImgCb?: () => boolean;
	addVidCb?: () => boolean;
	addLinkCb?: () => boolean;
	removeLinkCb?: () => boolean;
};

export function getGuideEditorExtensions(opts: GetEditorExtensionsOpts = {}) {
	const defaultOpts = {
		addImgCb: () => {},
		addVidCb: () => {},
		addLinkCb: () => {},
		removeLinkCb: () => {},
	};
	const _opts = Object.assign(defaultOpts, opts);
	return [
		Document,
		Paragraph,
		Text,
		Heading.configure({ levels: [1, 2, 3] }),
		History.configure({ depth: 50 }),
		TextAlign.configure({
			types: ['heading', 'paragraph'],
			alignments: ['left', 'center', 'right'],
		}),
		Placeholder.configure({ placeholder: '🔥 Teach others how to use this army...' }),
		Bold,
		Italic,
		CharacterCount.configure({ limit: GUIDE_TEXT_CHAR_LIMIT }),
		HorizontalRule,
		Strike,
		BulletList,
		OrderedList,
		ListItem,
		ListKeymap,
		Dropcursor.configure({ color: 'var(--primary-400)' }),
		Image.extend({
			addKeyboardShortcuts() {
				return {
					'Alt-i': _opts.addImgCb,
				};
			},
		}),
		Youtube.extend({
			addKeyboardShortcuts() {
				return {
					'Alt-v': _opts.addVidCb,
				};
			},
		}),
		Link.configure({
			protocols: ['https'],
			defaultProtocol: 'https',
			validate: (href) => /^https?:\/\//.test(href),
		}).extend({
			addKeyboardShortcuts() {
				return {
					'Mod-k': _opts.addLinkCb,
					'Mod-Shift-k': _opts.removeLinkCb,
				};
			},
		}),
		Gapcursor,
	];
}

export function checkGuideEditorSchema(text: string) {
	const extensions = getGuideEditorExtensions();
	const json = generateJSON(text, extensions);
	const schema = getSchema(extensions);
	const state = EditorState.create({ schema });

	// Check schema is valid
	schema.nodeFromJSON(json).check();

	// Check all images come from validated sources
	state.doc.descendants((node) => {
		const type = node.type.name;
		if (type !== 'image') {
			return false;
		}
		const imgSrc = node.attrs.src;
		if (!imgSrc?.length) {
			throw new Error('Invalid image URL');
		}
		// const imgurRegex = /^https:\/\/(?:i\.)?imgur\.com\/[a-zA-Z0-9]+(\.(jpg|jpeg|png|gif|bmp|tiff|webp))?$/;
		// if (!imgurRegex.test(imgSrc)) {
		// 	throw new Error('Only images on imgur can be saved');
		// }
	});
}

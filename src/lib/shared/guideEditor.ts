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
import Link from '@tiptap/extension-link';
import Gapcursor from '@tiptap/extension-gapcursor';

type GetExtensionsOpts = {
	addLinkCb?: () => boolean;
	removeLinkCb?: () => boolean;
};

export function getExtensions(opts: GetExtensionsOpts = {}) {
	const defaultOpts = {
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
		// Note: this does not count empty tags (such as just starting a paragraph on a newline)
		// but the server-side validation does so there is a bit of an inconsistency but practically no one would realize/care
		CharacterCount.configure({ limit: GUIDE_TEXT_CHAR_LIMIT }),
		HorizontalRule,
		Strike,
		BulletList,
		OrderedList,
		ListItem,
		ListKeymap,
		Dropcursor.configure({ color: 'var(--primary-400)' }),
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

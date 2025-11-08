import { GUIDE_TEXT_CHAR_LIMIT } from './utils';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Heading from '@tiptap/extension-heading';
import TextAlign from '@tiptap/extension-text-align';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Strike from '@tiptap/extension-strike';
import Link from '@tiptap/extension-link';
import { BulletList, OrderedList, ListItem, ListKeymap } from '@tiptap/extension-list';
import { Placeholder, UndoRedo, Dropcursor, Gapcursor, CharacterCount } from '@tiptap/extensions';

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
		UndoRedo.configure({ depth: 50 }),
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

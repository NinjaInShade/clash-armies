import type { ArmyCtx } from '$types';
import type { ArmyGuide } from './Army.svelte';
import type { VDocumentFragment, VHTMLDocument } from 'zeed-dom';

export class GuideModel {
	public ctx: ArmyCtx;

	/**
	 * Corresponding id in the army_guides table.
	 * May be undefined if not saved yet.
	 */
	public id?: number;
	public createdTime?: Date;
	public updatedTime?: Date;

	public textContent = $state<string | null>(null);
	public youtubeUrl = $state<string | null>(null);

	constructor(ctx: ArmyCtx, data?: Partial<ArmyGuide>) {
		this.ctx = ctx;

		this.id = data?.id;
		this.createdTime = data?.createdTime;
		this.updatedTime = data?.updatedTime;
		if (data?.textContent) {
			this.textContent = data.textContent;
		}
		if (data?.youtubeUrl) {
			this.youtubeUrl = data.youtubeUrl;
		}
	}

	public getSaveData() {
		return {
			id: this.id,
			textContent: this.textContent,
			youtubeUrl: this.youtubeUrl,
		};
	}

	/**
	 * Counts amount of characters inside the el and it's descendants
	 * This also counts an empty tag as one character
	 */
	public static countCharacters(el: HTMLElement | VDocumentFragment | VHTMLDocument) {
		let charCount = el.textContent?.length ?? 0;
		el.querySelectorAll('*').forEach((tag) => {
			const isEmpty = !tag.textContent || (tag.childNodes.length === 0 && tag.textContent.trim() === '');
			// zeed-dom doesn't seem to support querySelector(':empty')
			if (isEmpty) {
				charCount += 1;
			}
		});
		return charCount;
	}

	/**
	 * Merges adjacent empty tags, so for example 5 empty <p> tags get merged into one empty <p> tag
	 */
	public static mergeAdjacentEmptyTags(el: VDocumentFragment | VHTMLDocument) {
		let previousWasEmpty = false;
		el.querySelectorAll('*').forEach((tag) => {
			// zeed-dom doesn't seem to support querySelector(':empty')
			const isEmpty = !tag.textContent || (tag.childNodes.length === 0 && tag.textContent.trim() === '');
			if (isEmpty) {
				if (previousWasEmpty) {
					tag.remove();
				}
				previousWasEmpty = true;
			} else {
				previousWasEmpty = false;
			}
		});

		return el.render();
	}
}

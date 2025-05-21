import type { StaticGameData, Optional } from '$types';
import type { ArmyComment, StructuredArmyComment } from './Army.svelte';

export class CommentModel {
	public ctx: StaticGameData;

	/**
	 * Corresponding id in the army_comments table.
	 * May be undefined if not saved yet.
	 */
	public id?: number;
	public username?: string;
	public createdBy?: number;
	public createdTime?: Date;
	public updatedTime?: Date;

	public comment = $state('');
	public replyTo = $state<number | null>(null);
	public replies = $state<CommentModel[]>([]);

	constructor(ctx: StaticGameData, data: Optional<ArmyComment, 'id'>) {
		this.ctx = ctx;

		this.id = data?.id;
		this.username = data?.username;
		this.createdBy = data?.createdBy;
		this.createdTime = data?.createdTime;
		this.updatedTime = data?.updatedTime;
		if (data?.comment) {
			this.comment = data.comment;
		}
		if (data?.replyTo) {
			this.replyTo = data.replyTo;
		}
	}

	public getSaveData() {
		//
	}

	public static structureComments(comments: CommentModel[]) {
		const map: Record<string, StructuredArmyComment> = {};
		const structured: StructuredArmyComment[] = [];
		for (const comment of comments) {
			const { id, comment: text, replyTo, username, createdBy, createdTime, updatedTime } = comment;
			if (!id || !username || !createdBy || !createdTime || !updatedTime) {
				continue;
			}
			map[id] = { id, comment: text, replyTo, username, createdBy, createdTime, updatedTime, replies: [] };
		}
		for (const comment of comments) {
			if (!comment.id) {
				continue;
			}
			if (comment.replyTo === null) {
				// Top-level comment
				structured.push(map[comment.id]);
			} else if (map[comment.replyTo]) {
				// A reply, so add it to the replies of the parent comment
				map[comment.replyTo].replies.push(map[comment.id]);
			}
		}
		return structured;
	}
}

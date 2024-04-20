export class ValidationError extends Error {
	public name = 'ValidationError';
	public field?: string;

	constructor(validation?: { field: string; message?: string }) {
		if (validation) {
			super(validation.message);
			this.field = validation.field;
		} else {
			super();
		}
	}
}

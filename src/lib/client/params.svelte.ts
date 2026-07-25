import { page } from '$app/state';
import { goto } from '$app/navigation';

type Serializers<T> = {
	serialize(value: T): string;
	deserialize(value: string | undefined): T;
};
type ParamStoreOptions = {
	/**
	 * Other param keys to clear whenever this value is set.
	 * e.g. clearing army list `page` whenever a filter changes.
	 */
	resetKeys?: string[];
	/**
	 * Whether setting this value replaces the current history entry instead of pushing a new one.
	 *
	 * @default true
	 */
	replaceState?: boolean;
};

/**
 * Optimistically holds the params of a not-yet-applied navigation,
 * since `page.url` only updates once that navigation fully resolves.
 *
 * For server-filtered/paginated data, that's a network round-trip, so reads
 * should prefer this so UI doesn't wait on network for its own recent changes.
 */
let pendingParams = $state<URLSearchParams>();

/**
 * Resolves once pending param change has resolved (see `updateSearchParams`).
 * Only one of these is ever in flight at a time.
 */
let flushPromise: Promise<void> | undefined;

/**
 * Whether the next navigation should push a history entry.
 *
 * A batch can collapse setters that disagree, so any single push wins: replacing would swallow an
 * entry the user expects Back to return to, whereas an additional entry only costs one more Back press.
 */
let pendingPush = false;

/**
 * Applies a batch of param changes as a single navigation.
 *
 * Multiple calls within the same tick are automatically collapsed into a single navigation.
 * Each call still builds its own mutation/resetKeys based on previous call(s).
 */
async function updateSearchParams(mutate: (params: URLSearchParams) => void, options: ParamStoreOptions = {}): Promise<void> {
	const params = new URLSearchParams(currentSearchParams());
	mutate(params);
	for (const key of options.resetKeys ?? []) {
		params.delete(key);
	}
	pendingParams = params;
	pendingPush ||= options.replaceState === false;
	flushPromise ??= applyPendingParams();
	return flushPromise;
}

/**
 * Navigates to the current `pendingParams`, resolving only once every pending
 * param change, including any that arrive while navigating, has been applied.
 */
async function applyPendingParams() {
	// Let other sync `updateSearchParams` calls in this tick build on `pendingParams` first
	await Promise.resolve();

	while (pendingParams) {
		const params = pendingParams;

		// Read and cleared before awaiting, so a setter arriving mid-navigation
		// decides the next iteration for itself instead of inheriting this one's.
		const push = pendingPush;
		pendingPush = false;

		try {
			await goto(`?${params.toString()}`, {
				keepFocus: true,
				replaceState: !push,
				noScroll: true,
			});
		} catch (err) {
			console.error('Failed to navigate to pending parameters:', err);
		}
		if (pendingParams === params) {
			pendingParams = undefined;
		}
	}

	flushPromise = undefined;
}

/** The current params, preferring any not-yet-applied params over the real (stale) `page.url`. */
export function currentSearchParams(): URLSearchParams {
	return pendingParams ?? page.url.searchParams;
}

export function mkParamStore(key: string, type: 'boolean', options?: ParamStoreOptions): { value: boolean | undefined };
export function mkParamStore(key: string, type: 'number', options?: ParamStoreOptions): { value: number | undefined };
export function mkParamStore(key: string, type: 'string', options?: ParamStoreOptions): { value: string | undefined };
export function mkParamStore<T>(key: string, type: 'custom', serializers: Serializers<T>, options?: ParamStoreOptions): { value: T | undefined };
export function mkParamStore<T>(
	key: string,
	type: 'string' | 'number' | 'boolean' | 'custom',
	serializersOrOptions?: Serializers<T> | ParamStoreOptions,
	maybeOptions?: ParamStoreOptions
): { value: string | number | boolean | T | undefined } {
	const serializers = type === 'custom' ? (serializersOrOptions as Serializers<T>) : undefined;
	const options = type === 'custom' ? maybeOptions : (serializersOrOptions as ParamStoreOptions | undefined);

	return {
		get value() {
			const v = currentSearchParams().get(key);
			if (type === 'string') {
				return v || undefined;
			} else if (type === 'number') {
				return !v || Number.isNaN(+v) ? undefined : +v;
			} else if (type === 'boolean') {
				return v === 'true' ? true : v === 'false' ? false : undefined;
			} else if (type === 'custom') {
				if (!serializers) {
					throw new Error('Expected serializers object for custom param store');
				}
				return serializers.deserialize(v ?? undefined);
			} else {
				throw new Error(`Invalid store type "${type}"`);
			}
		},
		set value(value) {
			void updateSearchParams((params) => {
				if (type === 'boolean') {
					const _value = value === true ? 'true' : value === false ? 'false' : undefined;
					if (_value === undefined) {
						params.delete(key);
					} else {
						params.set(key, _value);
					}
				} else if (!value || (Array.isArray(value) && !value.length)) {
					params.delete(key);
				} else {
					if (type === 'custom') {
						if (!serializers) {
							throw new Error('Expected serializers object for custom param store');
						}
						params.set(key, serializers.serialize(value));
					} else {
						params.set(key, String(value));
					}
				}
			}, options);
		},
	};
}

/**
 * Read-only store for a 1-indexed page number.
 */
export function mkPageStore(key: string) {
	// Pushes rather than replaces, matching the behaviour of the anchor links `Pagination` uses.
	const store = mkParamStore(key, 'number', { replaceState: false });
	return {
		get value() {
			const value = store.value;
			return value !== undefined && Number.isInteger(value) && value >= 1 ? value : 1;
		},
		set value(page: number) {
			store.value = page > 1 ? page : undefined;
		},
	};
}

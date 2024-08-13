import { get, type Writable } from 'svelte/store';
import { page } from '$app/stores';
import { goto } from '$app/navigation';

type Serializers<T> = {
	serialize(value: T): string;
	deserialize(value: string | undefined): T;
};

let params: URLSearchParams | undefined;

export function mkParamStore(key: string, type: 'boolean'): Writable<boolean | undefined>;
export function mkParamStore(key: string, type: 'number'): Writable<number | undefined>;
export function mkParamStore(key: string, type: 'string'): Writable<string | undefined>;
export function mkParamStore<T>(key: string, type: 'custom', serializers: Serializers<T>): Writable<T | undefined>;
export function mkParamStore<T>(
	key: string,
	type: 'string' | 'number' | 'boolean' | 'custom',
	serializers?: Serializers<T>
): Writable<string | number | boolean | T | undefined> {
	return {
		subscribe(cb) {
			return page.subscribe((p) => {
				const v = p.url.searchParams.get(key);
				if (type === 'string') {
					cb(v || undefined);
				} else if (type === 'number') {
					cb(!v || Number.isNaN(+v) ? undefined : +v);
				} else if (type === 'boolean') {
					cb(v === 'true' ? true : v === 'false' ? false : undefined);
				} else if (type === 'custom') {
					if (!serializers) {
						throw new Error('Expected serializers object for custom param store');
					}
					cb(serializers.deserialize(v ?? undefined));
				} else {
					throw new Error(`Invalid store type "${type}"`);
				}
			});
		},
		set(value) {
			const newParams = Object.fromEntries(params ?? get(page).url.searchParams);
			if (type === 'boolean') {
				const _value = value === true ? 'true' : value === false ? 'false' : undefined;
				if (_value === undefined) {
					delete newParams[key];
				} else {
					newParams[key] = _value;
				}
			} else if (!value || (Array.isArray(value) && !value.length)) {
				delete newParams[key];
			} else {
				if (type === 'custom') {
					if (!serializers) {
						throw new Error('Expected serializers object for custom param store');
					}
					newParams[key] = serializers.serialize(value);
				} else {
					newParams[key] = String(value);
				}
			}
			// Update local variable in case of multiple stores updating params synchronously
			// Otherwise subsequent store updates will still have the "old" params
			const newSearchParams = new URLSearchParams(newParams);
			params = newSearchParams;
			goto(`?${newSearchParams.toString()}`, {
				keepFocus: true,
				replaceState: true,
				noScroll: true,
			});
		},
		update() {},
	};
}

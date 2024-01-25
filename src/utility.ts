export const IsNaN = (number: number) => number !== number;

export function DeepCloneTable<V>(value: ReadonlyArray<V>): Array<V>;
export function DeepCloneTable<V>(value: ReadonlySet<V>): Set<V>;
export function DeepCloneTable<K, V>(value: ReadonlyMap<K, V>): Map<K, V>;
export function DeepCloneTable<T extends object>(value: T): T;
export function DeepCloneTable<T extends object>(obj: T): T {
	const result = {};

	for (const [key, value] of pairs(obj)) {
		result[key as never] = typeIs(value, "table") ? (DeepCloneTable(value as never) as never) : (value as never);
	}

	return result as T;
}

import { ServiceIdentifier } from './instantiation';
import { SyncDescriptor } from './descriptors';

export class ServiceCollection {

	private _entries = new Map<ServiceIdentifier<any>, any>();

	constructor(...entries: [ServiceIdentifier<any>, any][]) {
		for (let [id, service] of entries) {
			this._entries.set(id, service);
		}
	}

	set<T>(id: ServiceIdentifier<T>, instanceOrDescriptor: T | SyncDescriptor<T>): T | SyncDescriptor<T> {
		const result = this._entries.get(id);
		this._entries.set(id, instanceOrDescriptor);
		return result;
	}

	forEach(callback: (id: ServiceIdentifier<any>, instanceOrDescriptor: any) => any): void {
		this._entries.forEach((value, key) => callback(key, value));
	}

	has(id: ServiceIdentifier<any>): boolean {
		return this._entries.has(id);
	}

	get<T>(id: ServiceIdentifier<T>): T | SyncDescriptor<T> {
		return this._entries.get(id);
	}
}

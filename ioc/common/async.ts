
export interface IDisposable {
	dispose(): void;
}
export interface IdleDeadline {
	readonly didTimeout: boolean;
	timeRemaining(): DOMHighResTimeStamp;
}
/**
 * Execute the callback the next time the browser is idle
 */
export let runWhenIdle: (callback: (idle: IdleDeadline) => void, timeout?: number) => IDisposable;
// requestIdleCallback, cancelIdleCallback 是在浏览器环境中的函数
declare function requestIdleCallback(callback: (args: IdleDeadline) => void, options?: { timeout: number }): number;
declare function cancelIdleCallback(handle: number): void;

(function () {
	if (typeof requestIdleCallback !== 'function' || typeof cancelIdleCallback !== 'function') {
		// 非浏览器环境会走这里
		const dummyIdle: IdleDeadline = Object.freeze({
			didTimeout: true,
			timeRemaining() { return 15; }
		});
		runWhenIdle = (runner) => {
			const handle = setTimeout(() => runner(dummyIdle));
			let disposed = false;
			return {
				dispose() {
					if (disposed) {
						return;
					}
					disposed = true;
					clearTimeout(handle);
				}
			};
		};
	} else {
		// 浏览器环境会处理这里
		runWhenIdle = (runner, timeout?) => {
			const handle: number = requestIdleCallback(runner, typeof timeout === 'number' ? { timeout } : undefined);
			let disposed = false;
			return {
				dispose() {
					if (disposed) {
						return;
					}
					disposed = true;
					cancelIdleCallback(handle);
				}
			};
		};
	}
})();
/**
 * An implementation of the "idle-until-urgent"-strategy as introduced
 * here: https://philipwalton.com/articles/idle-until-urgent/
 */
export class IdleValue<T> {

	private readonly _executor: () => void;
	private readonly _handle: IDisposable;

	private _didRun: boolean = false;
	private _value?: T;
	private _error: any;

	constructor(executor: () => T) {
		this._executor = () => {
			try {
				this._value = executor();
			} catch (err) {
				this._error = err;
			} finally {
				this._didRun = true;
			}
		};
		this._handle = runWhenIdle((tt) => {
			return this._executor();
		});
	}

	dispose(): void {
		this._handle.dispose();
	}

	getValue(): T {
		if (!this._didRun) {
			this._handle.dispose();
			this._executor();
		}
		if (this._error) {
			throw this._error;
		}
		return this._value!;
	}
}
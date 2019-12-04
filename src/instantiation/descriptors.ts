// 保存了原始类的构造函数，给其装饰更多属性。
export class SyncDescriptor<T> {
  readonly ctor: any;
  readonly staticArguments: any[];
  readonly supportsDelayedInstantiation: boolean;

  constructor(
    ctor: new (...args: any[]) => T,
    staticArguments: any[] = [],
    supportsDelayedINstantiation: boolean = false
  ) {
    this.ctor = ctor;
    this.staticArguments = staticArguments;
    this.supportsDelayedInstantiation = supportsDelayedINstantiation;
  }
}

import { Graph } from './graph';
import { IInstantiationService, ServicesAccessor, ServiceIdentifier, serviceIdManager } from './instantiation';
import { SyncDescriptor } from './descriptors';
import { ServiceCollection } from './serviceCollection';
import { IdleValue } from '../common/async';
/**
 * 处理循环依赖错误
*/
class CyclicDependencyError extends Error {
  constructor(graph: Graph<any>) {
    super('cyclic dependency between services');
    this.message = graph.toString();
  }
}

export class InstantiationService implements IInstantiationService {
  _serviceBrand: any;
  private readonly _services: ServiceCollection; // 存储服务关系的集合
	private readonly _strict: boolean;
  private readonly _parent?: InstantiationService; // 父级实例化服务。为什么如此分，我目前的猜想一个池子里的服务越少循环越少，效率越好，因此一个池子里的服务都是相互常用的，跨层级的时候少。
  constructor(services: ServiceCollection = new ServiceCollection(), strict: boolean = false, parent?: InstantiationService) {
		this._services = services;
		this._strict = strict;
		this._parent = parent;

		this._services.set(IInstantiationService, this);
  }

  /**
   * 反转函数
  */
  invokeFunction<R, TS extends any[] = []>(fn: (accessor: ServicesAccessor, ...args: TS) => R, ...args: TS): R {
		let _done = false;
		try {
			const accessor: ServicesAccessor = {
				get: <T>(id: ServiceIdentifier<T>) => {

					if (_done) {
						throw Error('service accessor is only valid during the invocation of its target method');
					}

					const result = this._getOrCreateServiceInstance(id);
					if (!result) {
						throw new Error(`[invokeFunction] unknown service '${id}'`);
					}
					return result;
				}
			};
			return fn.apply(undefined, [accessor, ...args]);
		} finally {
			_done = true;
		}
  }
  private _getOrCreateServiceInstance<T>(id: ServiceIdentifier<T>): T {
    let service = this._services.get(id);
    // 如果是装饰类，则去实例化，否则直接返回实例。
    return (service instanceof SyncDescriptor)
     ? this._createAndCacheServiceInstance(id, service)
     : service;
  }

  /**
   * 
   * @param id 
   * @param desc 
   * 实例化类并缓存直容器中
   */
  private _createAndCacheServiceInstance<T>(id: ServiceIdentifier<T>, desc: SyncDescriptor<T>): T {
    // service 信息描述结构：id与对应装饰器
    type ServiceInfo =  { id: ServiceIdentifier<any>, desc: SyncDescriptor<any>};
    // 构建依赖关系有向图
    const graph = new Graph<ServiceInfo>(data => data.id.toString());
    let cycleCount = 0;
    const stack = [{ id, desc }]; // 放入需要实例化的服务
    // 向图中写入此服务以及此服务依赖所需实例化的依赖
    while(stack.length) {
      const item = stack.pop() as ServiceInfo;
      graph.lookupOrInsertNode(item); // 向图里插入需要实例化的服务

      // a weak but working heuristic for cycle checks
      // 创建图的时候做循环依赖判断，构建图的时候放置循环依赖导致无限构建。
      // 此方法有一个弊端，如果是线性依赖到100个，则也会提示，因此，我们可以根据需求适当调整大小即可，比如100->150个依赖。
      // 但一般也用不完100
			if (cycleCount++ > 100) {
				console.log('cycleCount > 100');
				throw new CyclicDependencyError(graph);
			}

      for(let dependency of serviceIdManager.getServiceDependencies(item.desc.ctor)) {
        let instanceOrDesc = this._services.get(dependency.id);

        // 如果当前节点依赖的服务不存在于此服务集合中，并且此服务是必须要实例化的依赖，则报错。
        if (!instanceOrDesc && !dependency.optional) {
					console.warn(`[createInstance] ${id} depends on ${dependency.id} which is NOT registered.`);
        }

        // 如果此依赖服务还未实例化，则需要放入有向图中，去寻找它的依赖并实例化它。
        // 同时也需要将其作为一条依赖边画入有向图，表明`item`与此服务的依赖关系。
        if (instanceOrDesc instanceof SyncDescriptor) { 
          const d = { id: dependency.id, desc: instanceOrDesc };
					graph.insertEdge(item, d);
					stack.push(d);
        }
      }
    }

    // 根据有向图依赖关系，依次实例化服务
    while(true) {
      const roots = graph.roots(); // roots是只有被依赖，没有依赖其他的元素。
      if (roots.length === 0) {
				if (!graph.isEmpty()) {
          // 再次检测图里的循环依赖，这里我很疑问，前面构建图的时候已经检测了一次，为啥这里还需检测一次？
          // 防止死循环？
          console.log('期待这种情况出现：', graph);
					throw new CyclicDependencyError(graph);
        }
        // 表示所有节点依赖服务均已实例化完毕
        break;
      }
      for(const {data} of roots) {
        const instance = this._createServiceInstanceWithOwner(data.id, data.desc.ctor, data.desc.staticArguments, data.desc.supportsDelayedInstantiation);
        this._setServiceInstance(data.id, instance);
        graph.removeNode(data);
      }
      
    }
    return <T>this._services.get(id);
  }

  createInstance(ctorOrDescriptor: any | SyncDescriptor<any>, ...rest: any[]): any {
		let result: any;
		if (ctorOrDescriptor instanceof SyncDescriptor) {
			result = this._createInstance(ctorOrDescriptor.ctor, ctorOrDescriptor.staticArguments.concat(rest));
		} else {
			result = this._createInstance(ctorOrDescriptor, rest);
		}
		return result;
	}

  // 存放至相应的instance池里。
  private _setServiceInstance<T>(id: ServiceIdentifier<T>, instance: T): void {
		if (this._services.get(id) instanceof SyncDescriptor) {
			this._services.set(id, instance);
		} else if (this._parent) {
			this._parent._setServiceInstance(id, instance);
		} else {
			throw new Error('illegalState - setting UNKNOWN service instance');
		}
  }

  /**
   * 
   * @param id 
   * @param ctor 
   * @param args 
   * @param supportsDelayedInstantiation 是否支持延迟实例化
   * 从具有注册还服务的intantiationService中去实例化，所以叫withowner
   */
  private _createServiceInstanceWithOwner<T>(id: ServiceIdentifier<T>, ctor: any, args: any[] = [], supportsDelayedInstantiation: boolean): T {
		if (this._services.get(id) instanceof SyncDescriptor) {
			return this._createServiceInstance(ctor, args, supportsDelayedInstantiation);
		} else if (this._parent) {
      // 看父级有没有，如果顶层都没有，则报错，表示未注册此服务。
			return this._parent._createServiceInstanceWithOwner(id, ctor, args, supportsDelayedInstantiation);
		} else {
			throw new Error('illegalState - creating UNKNOWN service instance');
		}
  }

  /**
   * 
   * @param ctor 
   * @param args 
   * @param _supportsDelayedInstantiation 
   * 从当前服务池里找到服务，开始初始化
   */
  private _createServiceInstance<T>(ctor: any, args: any[] = [], _supportsDelayedInstantiation: boolean): T {
		if (!_supportsDelayedInstantiation) {
      // eager instantiation or no support JS proxies (e.g. IE11)
      // 不支持延迟实例化，则立即实例化
			return this._createInstance(ctor, args);

		} else {
      // 使用代理对象延迟实例化
			// Return a proxy object that's backed by an idle value. That
			// strategy is to instantiate services in our idle time or when actually
			// needed but not when injected into a consumer
      const idle = new IdleValue(() => this._createInstance<T>(ctor, args));
      // 此处代理对象Proxy会在调用这个实例的时候做拦截，然后去idel.getValue()获得实例。
			return <T>new Proxy(Object.create(null), {
				get(_target: T, prop: PropertyKey): any {
					return (idle.getValue() as any)[prop];
				},
				set(_target: T, p: PropertyKey, value: any): boolean {
					(idle.getValue() as any)[p] = value;
					return true;
				}
			});
		}
  }
  
  private _createInstance<T>(ctor: any, args: any[] = []): T {
    // args 只包含非注入的参数，即不是@xxx 开头的
    let serviceDependencies = serviceIdManager.getServiceDependencies(ctor).sort((a, b) => a.index - b.index);
    let serviceArgs: any[] = [];
    for (const dependency of serviceDependencies) {
			let service = this._getOrCreateServiceInstance(dependency.id);
			if (!service && this._strict && !dependency.optional) {
				throw new Error(`[createInstance] ${ctor.name} depends on UNKNOWN service ${dependency.id}.`);
			}
			serviceArgs.push(service);
    }
    // 标记第一注入服务是在参数中的位置
    let firstServiceArgPos = serviceDependencies.length > 0 ? serviceDependencies[0].index : args.length;
    if (args.length !== firstServiceArgPos) {
      // 处理的是当普通参数与注入的参数位置冲突的时候，报错，表示不支持。
      // 只支持注入参数在普通参数的后面。
			console.error(`[createInstance] First service dependency of ${ctor.name} at position ${
				firstServiceArgPos + 1} conflicts with ${args.length} static arguments, we only support 'normal params' before 'injected params'`);
    }
    return <T>new ctor(...[...args, ...serviceArgs]);
  }
}


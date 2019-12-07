/**
 * 服务装饰器 -> 本质为一个函数
 * 重写函数toString -> 使其返回服务本身名字
 * 具有type字段，其值为空，其类型为服务类型T
 */
export interface ServiceIdentifier<T> {
  (...args: any[]): void;
  type: T;
}
/**
 * 1. 存储已注册的服务装饰器
 * 2. 提供查询方法
 */
export namespace serviceIdManager {
  export const serviceIds = new Map<string, ServiceIdentifier<any>>();

  export const DI_TARGET = '$di$target';
  export const DI_DEPENDENCIES = '$di$dependencies';

  export function getServiceDependencies(
    ctor: any
  ): { id: ServiceIdentifier<any>; index: number; optional: boolean }[] {
    return ctor[DI_DEPENDENCIES] || [];
  }
}

/**
 * id 是函数，函数上有2个属性，`type属性`的`类型`表示服务类型
 * toString()会被重写，返回服务的名字(string).
 * 此函数用于存储服务依赖
 * 依赖关系存储对象本身身上的2个字段：DI_DEPENDENCIES、DI_TARGET
 * DI_DEPENDENCIES：是个数组，表示他所依赖的内容
 * DI_TARGET：是对象本身
 * */
function storeServiceDependency(
  id: Function,
  target: Function, // 被注入服务的那个对象本身
  index: number, // 被注入服务的服务序号，一般会在constructor里注入，指的就是给constructor传参的参数index，比如：constructor(service: service1) 则service的index=0
  optional: boolean
): void {
  if ((target as any)[serviceIdManager.DI_TARGET] === target) {
    (target as any)[serviceIdManager.DI_DEPENDENCIES].push({ id, index, optional });
  } else {
    (target as any)[serviceIdManager.DI_DEPENDENCIES] = [{ id, index, optional }];
    (target as any)[serviceIdManager.DI_TARGET] = target;
  }
}

export function createDecorator<T>(serviceId: string): ServiceIdentifier<T> {
  if(serviceIdManager.serviceIds.has(serviceId)) {
    // 放置服务装饰器多次构造
    return serviceIdManager.serviceIds.get(serviceId)!;
  }

  const id = <any> function(target: Function, key: string, index: number): any {
    if (arguments.length !== 3) {
      // 此为参数装饰器
      throw new Error(
        '@IServiceName-decorator can only be used to decorate a parameter'
      );
    }
    // 存储依赖关系
    storeServiceDependency(id, target, index, false);
  }
  id.toString = () => serviceId;
  serviceIdManager.serviceIds.set(serviceId, id);
  return id;
}

/**
 * 服务获取接口
 */
export interface ServicesAccessor {
  get<T>(id: ServiceIdentifier<T>): T;
}

/**
 * 创建实例化服务的装饰器
*/
export const IInstantiationService = createDecorator<IInstantiationService>(
  'instantiationService'
);

/**
 * 实例化服务类型
 */
export interface IInstantiationService {
  _serviceBrand: any;
  invokeFunction<R, TS extends any[] = []>(
    fn: (accessor: ServicesAccessor, ...args: TS) => R,
    ...args: TS
  ): R;
}
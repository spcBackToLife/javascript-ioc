// 服务的唯一身份识别器，识别一个身份为T的服务。
export interface ServiceIdentifier<T> {
  (...args: any[]): void; // 函数用于存储服务与服务之间的依赖关系
  type: T; // 根据类型来识别是哪个服务
}

// 存储服务的依赖关系，可以获得某个服务的依赖服务的Id, 注入顺序等。
/**
 * class Service1{ constructor(@service2 service2) {}}
 * 如上所述就是:_util.getServiceDependencies(service1) 则可以拿到他的依赖有 [service2]
 *  */
export namespace _util {
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
 * id 是函数，函数上有2个属性，`type属性`的`类型`表示服务类型, toString()会被重写，返回服务的名字(string). 函数用于存储服务依赖
 * */

function storeServiceDependency(
  id: Function,
  target: Function, // 被注入服务的那个对象本身
  index: number, // 被注入服务的服务序号，一般会在constructor里注入，指的就是给constructor传参的参数index，比如：constructor(service: service1) 则service的index=0
  optional: boolean
): void {
  if ((target as any)[_util.DI_TARGET] === target) {
    (target as any)[_util.DI_DEPENDENCIES].push({ id, index, optional });
  } else {
    (target as any)[_util.DI_DEPENDENCIES] = [{ id, index, optional }];
    (target as any)[_util.DI_TARGET] = target;
  }
}

/**
 * A *only* valid way to create a {{ServiceIdentifier}}.
 * 相当于是typescript的方法参数注解去生成服务。
 * 装饰器本身的作用是返回服务的一个唯一标识id函数，以及存储服务的依赖关系
 */
export function createDecorator<T>(serviceId: string): ServiceIdentifier<T> {
  if (_util.serviceIds.has(serviceId)) {
    return _util.serviceIds.get(serviceId)!;
  }

  const id = <any> function (target: Function, key: string, index: number): any {
    if (arguments.length !== 3) {
      throw new Error(
        '@IServiceName-decorator can only be used to decorate a parameter'
      );
    }
    console.log('什么时候执行的这里1:', target);
    storeServiceDependency(id, target, index, false);
  };

  id.toString = () => serviceId;

  _util.serviceIds.set(serviceId, id);
  return id;
}

export interface ServicesAccessor {
  get<T>(id: ServiceIdentifier<T>): T;
}

export const IInstantiationService = createDecorator<IInstantiationService>(
  'instantiationService'
);

export interface IInstantiationService {
  _serviceBrand: any;
  /**
   *
   */
  invokeFunction<R, TS extends any[] = []>(
    fn: (accessor: ServicesAccessor, ...args: TS) => R,
    ...args: TS
  ): R;
}

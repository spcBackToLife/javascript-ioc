import { ServiceCollection } from './instantiation/serviceCollection';
import { SyncDescriptor } from './instantiation/descriptors';
import { InstantiationService } from './instantiation/instantiationService';
import { Service5 } from './services/service5';
import { Service6 } from './services/service6';
import { Iservice5 } from './services/common/Iservice5';
import { Iservice6 } from './services/common/Iservice6';
import { Iservice1 } from './services/common/Iservice1';
import { Service1 } from './services/service1';

const services = new ServiceCollection();

const service5 = new Service5();

// 将没有依赖的服务实例注入到池子里--实例
services.set(Iservice5, service5);

// 将没有依赖的服务注入到池子里--装饰器
services.set(Iservice6, new SyncDescriptor(Service6));

// 注入存在依赖和参数的服务
services.set(Iservice1, new SyncDescriptor(Service1, ['pikun', 2]));

// 初始化的服务存入instances
const instantiationService = new InstantiationService(services, true);

instantiationService.invokeFunction(async accessor => {
  // 从容器中获取服务实例
  const service6 = accessor.get(Iservice6);
  const service1 = accessor.get(Iservice1);

  // 打印服务实例内容
  console.log('service6:', service6.name);
  console.log('service1:', service1);
}); 

console.log('--------------主动创建实例-------------------');

// 创建服务实例
const service1 = instantiationService.createInstance(Service1, 'jason', 12);
console.log('service1:', service1);
console.log('service1-name:', service1.name);
console.log('service1-age:', service1.age);
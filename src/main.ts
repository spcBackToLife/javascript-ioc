
import { ServiceCollection } from './instantiation/serviceCollection';
import { Service6 } from './services/service6';
import { Service1 } from './services/service1';

import { Iservice6 } from './services/common/Iservice6';
import { Service5 } from './services/service5';
import { Iservice5 } from './services/common/Iservice5';
import { Iservice1 } from './services/common/Iservice1';
import { SyncDescriptor } from './instantiation/descriptors';
import { InstantiationService } from './instantiation/instantiationService';

// console.log(12);
// //  // 新建服务集合
 const services = new ServiceCollection();

//  const service6 = new Service6();
//  services.set(Iservice6, service6);

 const service5 = new Service5();
 services.set(Iservice5, service5);

 services.set(Iservice6, new SyncDescriptor(Service6));
 
 services.set(Iservice1, new SyncDescriptor(Service1, ['pikun', 2]));
 console.log('services:', services);
 const instantiationService = new InstantiationService(services, true);
//  instantiationService.invokeFunction(async accessor => {
//    const service6 = accessor.get(Iservice6);
//    const service1 = accessor.get(Iservice1);
//    console.log('service6:', service6.name);
//    console.log('service1:', service1);
//  });
const service7 = new Service6();
service7.name = 'service7777';
const test = instantiationService.createInstance(Service1, 'vv', 12, service7);
console.log(test);

// const service6 = new Service6();
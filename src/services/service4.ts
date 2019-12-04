import { Service1 } from './service1';
import { Service2 } from './service2';
import { Iservice4 } from './common/Iservice4';
export class Service4 implements Iservice4 {
    _serviceBrand: any;
    name: string;
    constructor(public service1: Service1, public service2: Service2) {
        this.name="service4";
    }
}
import { Service1 } from './service1';
import { Service4 } from './service4';
import { Iservice3 } from './common/Iservice3';
export class Service3 implements Iservice3 {
    _serviceBrand: any;
    name: string;
    constructor(public service1: Service1, public service4: Service4) {
        this.name="service3";
    }
}
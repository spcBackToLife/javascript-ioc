import { Service3 } from './service3';
import { Service2 } from './service2';
import { Iservice5 } from './common/Iservice5';
export class Service5 implements Iservice5 {
    _serviceBrand: any;
    name: string;
    constructor() {
        this.name="service5";
    }
}
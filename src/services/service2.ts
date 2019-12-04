import { Service3 } from './service3';
import { Service4 } from './service4';
import { Iservice2 } from './common/Iservice2';
export class Service2 implements Iservice2 {
    _serviceBrand: any;
    name: string;
    constructor(public service3: Service3, public service4: Service4) {
        this.name="service2";
    }
}
import { Service6 } from './Service6';
// import { Service3 } from './service3';
import { Iservice1 } from './common/Iservice1';
import { Iservice6 } from './common/Iservice6';
import { Iservice5 } from './common/Iservice5';
export class Service1 implements Iservice1 {
    _serviceBrand: any;
    constructor(
        public name: string,
        public age: number,
        @Iservice6 public service6: Iservice6,
        @Iservice5 public service5: Iservice5
        ) {
    }
}
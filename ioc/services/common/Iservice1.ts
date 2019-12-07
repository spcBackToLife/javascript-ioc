import { createDecorator } from '../../instantiation/instantiation';
import { Iservice6 } from './Iservice6';
export const Iservice1 = createDecorator<Iservice1>('Iservice1');

export interface Iservice1 {
  _serviceBrand: any;
  name: string;
  service6: Iservice6;
}
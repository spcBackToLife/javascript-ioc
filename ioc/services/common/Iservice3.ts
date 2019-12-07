import { createDecorator } from '../../instantiation/instantiation';
export const Iservice3 = createDecorator<Iservice3>('Iservice3');

export interface Iservice3 {
  _serviceBrand: any;
  name: string;
}
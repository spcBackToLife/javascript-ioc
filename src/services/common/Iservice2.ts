import { createDecorator } from '../../instantiation/instantiation';
export const Iservice2 = createDecorator<Iservice2>('Iservice2');

export interface Iservice2 {
  _serviceBrand: any;
  name: string;
}
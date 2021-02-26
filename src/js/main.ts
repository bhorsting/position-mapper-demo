'use strict';

import '../scss/style.scss';
import { Demo } from './Demo';
document.addEventListener(
  'DOMContentLoaded',
  () => {
    main('hello');
  },
  false
);

const main = (message: string): void => {
  // eslint-disable-next-line no-console
  console.log(message);
};

const demo: Demo = new Demo();
console.log('Initialized the demo at', demo);

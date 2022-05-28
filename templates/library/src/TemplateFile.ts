import { Temporal } from '@js-temporal/polyfill';

export interface TemplateInterface {
  value: string;
}

export const TEMPLATE_VALUE: TemplateInterface = {
  value: 'hello world',
};

export const AN_INSTANT = Temporal.Instant.from('2022-04-30T07:51:25.56Z');

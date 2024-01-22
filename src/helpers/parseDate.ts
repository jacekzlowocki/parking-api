import { parseISO } from 'date-fns';
import { isString } from 'lodash';

export const parseDate = (date: Date | string | undefined): Date | undefined =>
  isString(date) ? parseISO(date) : date;

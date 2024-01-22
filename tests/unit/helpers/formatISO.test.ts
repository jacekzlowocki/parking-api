import { formatISO } from '../../../src/helpers/formatISO';

describe('formatISO', () => {
  it('returns string', () => {
    const date = new Date('2024-01-22T20:00:00Z');
    const result = formatISO(date);

    expect(result).toEqual('2024-01-22T20:00:00.000Z');
  });
});

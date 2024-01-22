import { uformatISO } from '../../../src/helpers/uformatISO';

describe('uformatISO', () => {
  it('returns string', () => {
    const date = new Date('2024-01-22T20:00:00Z');
    const result = uformatISO(date);

    expect(result).toEqual('2024-01-22T20:00:00.000Z');
  });
});

import { MissingHomeIdError, requireHomeId } from '@/lib/home/require-home-id';

describe('requireHomeId', () => {
  it('returns a trimmed home_id when valid', () => {
    expect(requireHomeId('  aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa  ')).toBe(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    );
  });

  it('throws MissingHomeIdError when home_id is missing', () => {
    expect(() => requireHomeId(null)).toThrow(MissingHomeIdError);
    expect(() => requireHomeId(undefined)).toThrow(MissingHomeIdError);
    expect(() => requireHomeId('')).toThrow(MissingHomeIdError);
    expect(() => requireHomeId('   ')).toThrow(MissingHomeIdError);
  });
});

import { loginSchema, registerSchema } from '@/schemas/auth.schema';
import {
  createHomeInputSchema,
  joinHomeInputSchema,
} from '@/schemas/onboarding.schema';
import { ACTIVE_HOME_ID_KEY } from '@/lib/home/storage';

describe('auth schemas', () => {
  it('accepts a valid login payload', () => {
    expect(
      loginSchema.parse({
        email: 'ana@hompany.local',
        password: 'password123',
      }),
    ).toEqual({
      email: 'ana@hompany.local',
      password: 'password123',
    });
  });

  it('rejects short passwords on register', () => {
    expect(() =>
      registerSchema.parse({
        displayName: 'Ana',
        email: 'ana@hompany.local',
        password: '123',
      }),
    ).toThrow();
  });
});

describe('onboarding schemas', () => {
  it('normalizes invite codes to uppercase', () => {
    expect(joinHomeInputSchema.parse({ inviteCode: ' abcd1234 ' })).toEqual({
      inviteCode: 'ABCD1234',
    });
  });

  it('requires a home name', () => {
    expect(() => createHomeInputSchema.parse({ name: '' })).toThrow();
  });
});

describe('active home storage key', () => {
  it('exports a stable AsyncStorage key', () => {
    expect(ACTIVE_HOME_ID_KEY).toBe('hompany.activeHomeId');
  });
});

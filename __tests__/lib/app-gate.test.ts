import { getAppGateState } from '@/lib/navigation/app-gate';

describe('getAppGateState', () => {
  it('returns loading while auth or home is loading', () => {
    expect(
      getAppGateState({
        isAuthLoading: true,
        isHomeLoading: false,
        hasSession: false,
        activeHomeId: null,
        homesCount: 0,
      }),
    ).toBe('loading');

    expect(
      getAppGateState({
        isAuthLoading: false,
        isHomeLoading: true,
        hasSession: true,
        activeHomeId: null,
        homesCount: 0,
      }),
    ).toBe('loading');
  });

  it('returns unauthenticated without session', () => {
    expect(
      getAppGateState({
        isAuthLoading: false,
        isHomeLoading: false,
        hasSession: false,
        activeHomeId: null,
        homesCount: 0,
      }),
    ).toBe('unauthenticated');
  });

  it('returns needs_home when session exists but no active home', () => {
    expect(
      getAppGateState({
        isAuthLoading: false,
        isHomeLoading: false,
        hasSession: true,
        activeHomeId: null,
        homesCount: 0,
      }),
    ).toBe('needs_home');

    expect(
      getAppGateState({
        isAuthLoading: false,
        isHomeLoading: false,
        hasSession: true,
        activeHomeId: null,
        homesCount: 2,
      }),
    ).toBe('needs_home');
  });

  it('returns ready when session and activeHomeId are present', () => {
    expect(
      getAppGateState({
        isAuthLoading: false,
        isHomeLoading: false,
        hasSession: true,
        activeHomeId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        homesCount: 1,
      }),
    ).toBe('ready');
  });
});

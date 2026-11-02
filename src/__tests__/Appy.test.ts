jest.mock('../AppyModule', () => {
  const listeners = new Map<string, Set<Function>>();
  return {
    __esModule: true,
    default: {
      nativeSdkVersion: '1.0.0',
      configure: jest.fn(),
      handleUrl: jest.fn(async () => true),
      track: jest.fn(),
      setUserId: jest.fn(),
      setTrackingEnabled: jest.fn(),
      isTrackingEnabled: jest.fn(async () => false),
      buildLink: jest.fn(async () => 'https://acme.appy.to/spring?ref=u1'),
      flush: jest.fn(),
      getAttribution: jest.fn(async (): Promise<unknown> => null),
      getLatestDeepLink: jest.fn(async (): Promise<unknown> => null),
      addListener: jest.fn((event: string, listener: Function) => {
        const set = listeners.get(event) ?? new Set<Function>();
        set.add(listener);
        listeners.set(event, set);
        return { remove: () => set.delete(listener) };
      }),
      emit: (event: string, payload: unknown) => listeners.get(event)?.forEach((listener) => listener(payload)),
      reset: () => listeners.clear(),
    },
  };
});

import Appy, { type AppyDeepLinkResult, isAppyLink } from '../index';

const mockModule = jest.requireMock('../AppyModule').default;

function emit(event: string, payload: unknown) {
  mockModule.emit(event, payload);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockModule.reset();
});

describe('configure', () => {
  it('fills in the native defaults', () => {
    Appy.configure({ publishableKey: 'appy_pk_test', linkDomains: ['acme.appy.to'] });

    expect(mockModule.configure).toHaveBeenCalledWith({
      publishableKey: 'appy_pk_test',
      linkDomains: ['acme.appy.to'],
      emailLinkDomains: [],
      logLevel: 'error',
      openDeferredDeepLinks: false,
      deferredDeepLinkTimeoutMillis: 5000,
      launchLinkWaitMillis: 500,
      requestTimeoutMillis: 10000,
      apiBaseUrl: null,
      android: { collectInstallReferrer: true, metaAppId: null },
    });
  });

  it('passes every option', () => {
    Appy.configure({
      publishableKey: 'appy_pk_test',
      linkDomains: ['acme.appy.to'],
      logLevel: 'debug',
      openDeferredDeepLinks: true,
      deferredDeepLinkTimeoutMs: 8000,
      launchLinkWaitMs: 250,
      requestTimeoutMs: 20000,
      apiBaseUrl: 'https://staging-api.appy.to',
      android: { collectInstallReferrer: false, metaAppId: '1234567890' },
    });

    expect(mockModule.configure).toHaveBeenCalledWith(
      expect.objectContaining({
        logLevel: 'debug',
        openDeferredDeepLinks: true,
        deferredDeepLinkTimeoutMillis: 8000,
        launchLinkWaitMillis: 250,
        requestTimeoutMillis: 20000,
        apiBaseUrl: 'https://staging-api.appy.to',
        android: { collectInstallReferrer: false, metaAppId: '1234567890' },
      })
    );
  });
});

describe('deep links', () => {
  it('decodes found, notFound and failed results', () => {
    const results: AppyDeepLinkResult[] = [];
    Appy.addDeepLinkListener((result) => results.push(result));

    emit('onDeepLink', {
      status: 'found',
      link: {
        url: 'https://acme.appy.to/spring?item=42',
        deeplinkUrl: 'acme://items?item=42',
        slug: 'spring',
        parameters: { item: '42' },
        isDeferred: true,
        clickedAtMillis: 1760000000000,
      },
    });
    emit('onDeepLink', { status: 'notFound' });
    emit('onDeepLink', { status: 'failed', error: 'timeout' });
    emit('onDeepLink', { status: 'failed', error: 'network' });
    emit('onDeepLink', { status: 'failed', error: 'invalidResponse' });

    expect(results).toEqual([
      {
        status: 'found',
        link: {
          url: 'https://acme.appy.to/spring?item=42',
          deeplinkUrl: 'acme://items?item=42',
          slug: 'spring',
          parameters: { item: '42' },
          isDeferred: true,
          clickedAt: new Date(1760000000000),
        },
      },
      { status: 'notFound' },
      { status: 'failed', error: 'timeout' },
      { status: 'failed', error: 'network' },
      { status: 'failed', error: 'invalidResponse' },
    ]);
  });

  it('fills missing optional fields of an offline fallback link with null', () => {
    const results: AppyDeepLinkResult[] = [];
    Appy.addDeepLinkListener((result) => results.push(result));

    emit('onDeepLink', { status: 'found', link: { url: 'https://acme.appy.to/spring', slug: 'spring', isDeferred: false } });

    expect(results[0]).toEqual({
      status: 'found',
      link: {
        url: 'https://acme.appy.to/spring',
        deeplinkUrl: null,
        slug: 'spring',
        parameters: {},
        isDeferred: false,
        clickedAt: null,
      },
    });
  });

  it('stops delivering after remove', () => {
    const listener = jest.fn();
    const subscription = Appy.addDeepLinkListener(listener);
    subscription.remove();

    emit('onDeepLink', { status: 'notFound' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('rejects an unknown status loudly', () => {
    Appy.addDeepLinkListener(() => undefined);
    expect(() => emit('onDeepLink', { status: 'surprise' })).toThrow('Unknown deep link status');
  });

  it('getLatestDeepLink decodes the stored link', async () => {
    mockModule.getLatestDeepLink.mockResolvedValueOnce({ slug: 'spring', parameters: { item: '42' }, isDeferred: false });

    await expect(Appy.getLatestDeepLink()).resolves.toEqual({
      url: null,
      deeplinkUrl: null,
      slug: 'spring',
      parameters: { item: '42' },
      isDeferred: false,
      clickedAt: null,
    });
  });

  it('handleUrl forwards the URL', async () => {
    await expect(Appy.handleUrl('https://acme.appy.to/spring')).resolves.toBe(true);
    expect(mockModule.handleUrl).toHaveBeenCalledWith('https://acme.appy.to/spring');
  });
});

describe('attribution', () => {
  it('decodes organic, link and ad network attribution', () => {
    const attributions: unknown[] = [];
    Appy.addAttributionListener((attribution) => attributions.push(attribution));

    emit('onAttribution', { isOrganic: true });
    emit('onAttribution', {
      isOrganic: false,
      linkSlug: 'spring',
      linkTitle: 'Spring sale',
      source: 'newsletter',
      medium: 'email',
      campaign: 'spring-2026',
      clickedAtMillis: 1760000000000,
    });
    emit('onAttribution', { isOrganic: false, network: { name: 'meta', campaignId: '7', touch: 'view' } });

    expect(attributions).toEqual([
      {
        isOrganic: true,
        linkSlug: null,
        linkTitle: null,
        source: null,
        medium: null,
        campaign: null,
        clickedAt: null,
        network: null,
      },
      {
        isOrganic: false,
        linkSlug: 'spring',
        linkTitle: 'Spring sale',
        source: 'newsletter',
        medium: 'email',
        campaign: 'spring-2026',
        clickedAt: new Date(1760000000000),
        network: null,
      },
      {
        isOrganic: false,
        linkSlug: null,
        linkTitle: null,
        source: null,
        medium: null,
        campaign: null,
        clickedAt: null,
        network: {
          name: 'meta',
          campaignId: '7',
          campaignName: null,
          adGroupId: null,
          adGroupName: null,
          adId: null,
          clickId: null,
          touch: 'view',
        },
      },
    ]);
  });

  it('getAttribution returns null before Appy answers', async () => {
    await expect(Appy.getAttribution()).resolves.toBeNull();
  });
});

describe('events and users', () => {
  it('track sends revenue, currency and deduplicationId', () => {
    Appy.track('purchase', {
      properties: { sku: 'A1', qty: 2, gift: false },
      revenue: 19.98,
      currency: 'USD',
      deduplicationId: 'GPA.1234-5678',
    });

    expect(mockModule.track).toHaveBeenCalledWith('purchase', {
      properties: { sku: 'A1', qty: 2, gift: false },
      revenue: 19.98,
      currency: 'USD',
      deduplicationId: 'GPA.1234-5678',
    });
  });

  it('track drops values the native SDKs cannot store', () => {
    Appy.track('signup', {
      properties: { plan: 'pro', score: Number.NaN, at: new Date() as unknown as string },
      revenue: Number.POSITIVE_INFINITY,
    });

    expect(mockModule.track).toHaveBeenCalledWith('signup', {
      properties: { plan: 'pro' },
      revenue: null,
      currency: null,
      deduplicationId: null,
    });
  });

  it('forwards user and tracking calls', async () => {
    Appy.setUserId('u_123');
    Appy.setUserId(null);
    Appy.setTrackingEnabled(false);
    Appy.flush();

    expect(mockModule.setUserId.mock.calls).toEqual([['u_123'], [null]]);
    expect(mockModule.setTrackingEnabled).toHaveBeenCalledWith(false);
    expect(mockModule.flush).toHaveBeenCalled();
    await expect(Appy.isTrackingEnabled()).resolves.toBe(false);
  });

  it('buildLink defaults to no parameters', async () => {
    await expect(Appy.buildLink('spring')).resolves.toBe('https://acme.appy.to/spring?ref=u1');
    expect(mockModule.buildLink).toHaveBeenCalledWith('spring', {});
  });

  it('exposes the native and plugin versions', () => {
    expect(Appy.nativeSdkVersion()).toBe('1.0.0');
    expect(Appy.pluginVersion).toBe(require('../../package.json').version);
  });
});

describe('isAppyLink', () => {
  it('matches the configured link domains and appy_click_id', () => {
    Appy.configure({ publishableKey: 'appy_pk_test', linkDomains: ['Acme.Appy.to'] });

    expect(isAppyLink('https://acme.appy.to/spring?item=42')).toBe(true);
    expect(isAppyLink('http://ACME.appy.to')).toBe(true);
    expect(isAppyLink('acme://items/42?appy_click_id=c_1')).toBe(true);
    expect(isAppyLink('acme://items/42?ref=appy_click_id')).toBe(false);
    expect(isAppyLink('https://acme.com/spring')).toBe(false);
    expect(isAppyLink('acme://acme.appy.to/spring')).toBe(false);
    expect(isAppyLink('/spring')).toBe(false);
  });

  it('also matches the configured email link domains', () => {
    Appy.configure({ publishableKey: 'appy_pk_test', linkDomains: ['acme.appy.to'], emailLinkDomains: ['Links.Example.com'] });

    expect(mockModule.configure).toHaveBeenCalledWith(expect.objectContaining({ emailLinkDomains: ['Links.Example.com'] }));
    expect(isAppyLink('https://links.example.com/uni/ls/click?upn=abc')).toBe(true);
    expect(isAppyLink('https://acme.appy.to/spring')).toBe(true);
    expect(isAppyLink('https://example.com/uni/ls/click?upn=abc')).toBe(false);
  });

  it('accepts explicit domains for code that runs before configure', () => {
    expect(isAppyLink('https://go.acme.com/x', ['https://go.acme.com/'])).toBe(true);
    expect(isAppyLink('https://go.acme.com/x', ['applinks:go.acme.com'])).toBe(true);
    expect(isAppyLink('https://user@go.acme.com:443/x', ['go.acme.com'])).toBe(true);
  });
});

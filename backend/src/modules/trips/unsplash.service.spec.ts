import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UnsplashService } from './unsplash.service';

describe('UnsplashService', () => {
  const originalEnvKey = process.env.UNSPLASH_ACCESS_KEY;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.UNSPLASH_ACCESS_KEY = 'secret-unsplash-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalEnvKey === undefined) {
      delete process.env.UNSPLASH_ACCESS_KEY;
    } else {
      process.env.UNSPLASH_ACCESS_KEY = originalEnvKey;
    }
    vi.restoreAllMocks();
  });

  it('normalizes query from destination "Đà Lạt, Lâm Đồng" to "Da Lat" and returns regular URL with ixid', async () => {
    const expectedUrl =
      'https://images.unsplash.com/photo-123456?auto=format&fit=crop&w=1080&ixid=abc123';
    const downloadUrl = 'https://api.unsplash.com/photos/123/download?ixid=abc123';

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              urls: { regular: expectedUrl },
              links: { download_location: downloadUrl },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: true });
    global.fetch = fetchMock as any;

    const service = new UnsplashService();
    const cover = await service.findCover('Đà Lạt, Lâm Đồng');

    expect(cover).toBe(expectedUrl);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [searchCallUrl, searchOpts] = fetchMock.mock.calls[0];
    const parsedUrl = new URL(searchCallUrl);
    expect(parsedUrl.origin + parsedUrl.pathname).toBe(
      'https://api.unsplash.com/search/photos',
    );
    expect(parsedUrl.searchParams.get('query')).toBe('Da Lat');
    expect(parsedUrl.searchParams.get('per_page')).toBe('1');
    expect(parsedUrl.searchParams.get('orientation')).toBe('landscape');
    expect(parsedUrl.searchParams.get('content_filter')).toBe('high');
    expect(searchOpts.headers).toEqual({
      Authorization: 'Client-ID secret-unsplash-key',
      'Accept-Version': 'v1',
    });
    expect(searchOpts.signal).toBeInstanceOf(AbortSignal);

    expect(fetchMock.mock.calls[1][0]).toBe(downloadUrl);
    expect(fetchMock.mock.calls[1][1].headers).toEqual({
      Authorization: 'Client-ID secret-unsplash-key',
      'Accept-Version': 'v1',
    });
  });

  it('returns null when results array is empty', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    }) as any;

    const service = new UnsplashService();
    await expect(service.findCover('Unknown Place')).resolves.toBeNull();
  });

  it('does not call fetch and returns null when UNSPLASH_ACCESS_KEY is missing', async () => {
    delete process.env.UNSPLASH_ACCESS_KEY;
    const fetchMock = vi.fn();
    global.fetch = fetchMock as any;

    const service = new UnsplashService();
    await expect(service.findCover('Đà Nẵng')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null on 403 or 429 quota/rate-limit errors', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 403 })
      .mockResolvedValueOnce({ ok: false, status: 429 }) as any;

    const service = new UnsplashService();
    await expect(service.findCover('Hà Nội')).resolves.toBeNull();
    await expect(service.findCover('Huế')).resolves.toBeNull();
  });

  it('returns null on timeout or network error without throwing', async () => {
    const timeoutErr = new Error('The operation was aborted due to timeout');
    timeoutErr.name = 'TimeoutError';
    global.fetch = vi.fn().mockRejectedValueOnce(timeoutErr) as any;

    const service = new UnsplashService();
    await expect(service.findCover('Phú Quốc')).resolves.toBeNull();
  });

  it('returns null on malformed JSON response without throwing', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    }) as any;

    const service = new UnsplashService();
    await expect(service.findCover('Nha Trang')).resolves.toBeNull();
  });

  it('rejects untrusted image hosts and ignores untrusted download_location hosts', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              urls: { regular: 'https://evil.example.com/photo.jpg' },
              links: { download_location: 'https://api.unsplash.com/photos/1/download' },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              urls: { regular: 'https://images.unsplash.com/photo-ok?ixid=1' },
              links: { download_location: 'https://evil.example.com/track' },
            },
          ],
        }),
      });
    global.fetch = fetchMock as any;

    const service = new UnsplashService();
    await expect(service.findCover('Sapa')).resolves.toBeNull();

    const valid = await service.findCover('Hội An');
    expect(valid).toBe('https://images.unsplash.com/photo-ok?ixid=1');
    // download_location on evil host must not be fetched
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not fail findCover when download_location tracking errors', async () => {
    const expectedUrl = 'https://images.unsplash.com/photo-safe?ixid=xyz';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              urls: { regular: expectedUrl },
              links: { download_location: 'https://api.unsplash.com/photos/safe/download' },
            },
          ],
        }),
      })
      .mockRejectedValueOnce(new Error('Tracking failed'));
    global.fetch = fetchMock as any;

    const service = new UnsplashService();
    await expect(service.findCover('Quy Nhơn')).resolves.toBe(expectedUrl);
  });

  it('never logs error.message containing the access key when fetch throws', async () => {
    const leakyErr = new Error('Fetch failed with header Authorization: Client-ID secret-unsplash-key');
    leakyErr.name = 'FetchError';
    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(leakyErr)
      .mockRejectedValueOnce('Authorization: Client-ID secret-unsplash-key') as any;

    const service = new UnsplashService();
    const warnSpy = vi.spyOn((service as any).logger, 'warn');

    await expect(service.findCover('Đà Lạt')).resolves.toBeNull();
    await expect(service.findCover('Hà Nội')).resolves.toBeNull();

    expect(warnSpy).toHaveBeenCalledTimes(2);
    for (const call of warnSpy.mock.calls) {
      const serialized = call.map(String).join(' ');
      expect(serialized).not.toContain('secret-unsplash-key');
    }
    expect(warnSpy.mock.calls[0][0]).toContain('FetchError');
    expect(warnSpy.mock.calls[1][0]).toContain('lỗi không xác định');
  });
});

import { getSharePaths, SHARE_FOLDERS } from '$lib/cbd/path-map';

describe('getSharePaths', () => {
  const tests = [
    {
      path: '/external/catalog/Spring 2026/IMG_0001.JPG',
      windows: String.raw`Z:\Catalog\Spring 2026\IMG_0001.JPG`,
      linux: '/mnt/main/Catalog/Spring 2026/IMG_0001.JPG',
    },
    {
      path: '/external/marketing/Ads/banner.png',
      windows: String.raw`Z:\Marketing\Ads\banner.png`,
      linux: '/mnt/main/Marketing/Ads/banner.png',
    },
    {
      path: '/external/users/kerry/a.jpg',
      windows: String.raw`Z:\Users\Kerry\a.jpg`,
      linux: '/mnt/main/Users/Kerry/a.jpg',
    },
    {
      path: '/external/users/nicole/a.jpg',
      windows: String.raw`Z:\Users\Nicole\a.jpg`,
      linux: '/mnt/main/Users/Nicole/a.jpg',
    },
    {
      path: '/external/users/morgan_roper/a.jpg',
      windows: String.raw`Z:\Users\Morgan Roper\a.jpg`,
      linux: '/mnt/main/Users/Morgan Roper/a.jpg',
    },
    {
      path: '/external/users/chris_jones/a.jpg',
      windows: String.raw`Z:\Users\Chris Jones\a.jpg`,
      linux: '/mnt/main/Users/Chris Jones/a.jpg',
    },
    {
      path: '/external/users/morgan_moon/web_elements/blog/2026/Post Image.webp',
      windows: String.raw`Z:\Users\Morgan Moon\WEB ELEMENTS\BLOG\2026\Post Image.webp`,
      linux: '/mnt/main/Users/Morgan Moon/WEB ELEMENTS/BLOG/2026/Post Image.webp',
    },
    {
      path: '/external/users/morgan_moon/web_elements/how-tos/Step 1.png',
      windows: String.raw`Z:\Users\Morgan Moon\WEB ELEMENTS\How-Tos\Step 1.png`,
      linux: '/mnt/main/Users/Morgan Moon/WEB ELEMENTS/How-Tos/Step 1.png',
    },
  ];

  for (const { path, windows, linux } of tests) {
    it(`maps ${path}`, () => {
      expect(getSharePaths(path)).toEqual({ windows, linux });
    });
  }

  it('has a test for every mapped prefix', () => {
    for (const prefix of Object.keys(SHARE_FOLDERS)) {
      expect(tests.some(({ path }) => path.startsWith(`${prefix}/`))).toBe(true);
    }
  });

  it('keeps the case of everything below the mount point', () => {
    expect(getSharePaths('/external/catalog/MiXeD/File.JPG')?.linux).toBe('/mnt/main/Catalog/MiXeD/File.JPG');
  });

  it('only matches a prefix at a / boundary', () => {
    expect(getSharePaths('/external/catalog2/a.jpg')).toBeUndefined();
    expect(getSharePaths('/external/catalog.jpg')).toBeUndefined();
  });

  it('matches the prefix itself', () => {
    expect(getSharePaths('/external/catalog')).toEqual({ windows: String.raw`Z:\Catalog`, linux: '/mnt/main/Catalog' });
  });

  it('does not match a parent of a mapped folder', () => {
    expect(getSharePaths('/external/users/morgan_moon/other/a.jpg')).toBeUndefined();
  });

  it('is case-sensitive on the container path', () => {
    expect(getSharePaths('/External/Catalog/a.jpg')).toBeUndefined();
  });

  it('returns undefined for Immich uploads', () => {
    expect(getSharePaths('/usr/src/app/upload/library/admin/2026/a.jpg')).toBeUndefined();
    expect(getSharePaths('/data/library/admin/2026/a.jpg')).toBeUndefined();
  });

  it('uses the longest matching prefix, whatever the table order', () => {
    for (const folders of [
      { '/external/a': 'A', '/external/a/b': 'Nested/B' },
      { '/external/a/b': 'Nested/B', '/external/a': 'A' },
    ]) {
      expect(getSharePaths('/external/a/b/c.jpg', folders)).toEqual({
        windows: String.raw`Z:\Nested\B\c.jpg`,
        linux: '/mnt/main/Nested/B/c.jpg',
      });
      expect(getSharePaths('/external/a/c.jpg', folders)).toEqual({
        windows: String.raw`Z:\A\c.jpg`,
        linux: '/mnt/main/A/c.jpg',
      });
    }
  });
});

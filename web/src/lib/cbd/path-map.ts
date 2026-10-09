// Container library mount -> folder in the company_files share (Z:\ on Windows, /mnt/main on Linux).
// Mirrors the library volume mounts in the production docker-compose.yml; update both together.
// This ships in the public web bundle, so only put paths here that are fine for anyone to read.
export const SHARE_FOLDERS: Record<string, string> = {
  '/external/catalog': 'Catalog',
  '/external/marketing': 'Marketing',
  '/external/users/kerry': 'Users/Kerry',
  '/external/users/nicole': 'Users/Nicole',
  '/external/users/morgan_roper': 'Users/Morgan Roper',
  '/external/users/chris_jones': 'Users/Chris Jones',
  '/external/users/morgan_moon/web_elements/blog': 'Users/Morgan Moon/WEB ELEMENTS/BLOG',
  '/external/users/morgan_moon/web_elements/how-tos': 'Users/Morgan Moon/WEB ELEMENTS/How-Tos',
};

export type SharePaths = { windows: string; linux: string };

export const getSharePaths = (originalPath: string, folders = SHARE_FOLDERS): SharePaths | undefined => {
  let prefix: string | undefined;
  for (const candidate of Object.keys(folders)) {
    const matches = originalPath === candidate || originalPath.startsWith(`${candidate}/`);
    if (matches && (!prefix || candidate.length > prefix.length)) {
      prefix = candidate;
    }
  }

  if (!prefix) {
    return;
  }

  const sharePath = folders[prefix] + originalPath.slice(prefix.length);
  return {
    windows: `Z:\\${sharePath.replaceAll('/', '\\')}`,
    linux: `/mnt/main/${sharePath}`,
  };
};

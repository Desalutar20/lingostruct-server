import "./auth.requests.js";
import "./user.requests.js";
import "./db.requests.js";
import "./cache.requests.js";
import "./admin/index.js";

export const applySearch = (url: URL, search?: Record<string, unknown>) => {
  if (search === undefined) return;

  for (const key in search) {
    if (!Object.hasOwn(search, key)) continue;

    url.searchParams.append(key, search[key] as string);
  }
};

// The overview page has no link anywhere in the app. Typing /overview opens it:
// the path is swapped for the hash route the app uses everywhere else.
export function overviewRedirect(pathname, hash) {
  if (hash) return null;
  return /^\/overview\/?$/.test(pathname) ? '/#/overview' : null;
}

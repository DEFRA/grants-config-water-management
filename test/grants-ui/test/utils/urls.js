export function formatUrlForPath(path, regex = true) {
  if (regex === true) {
    return new RegExp(String.raw`water-management/${path}(\?ref=[^&]+)?$`)
  }
  return `/water-management/${path}`
}

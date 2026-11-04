export async function formatUrlForPath(path, regex = true) {
  if (regex === true) {
    return new RegExp(`water-management/${path}(\\?ref=[^&]+)?$`)
  }
  return `/water-management/${path}`
}

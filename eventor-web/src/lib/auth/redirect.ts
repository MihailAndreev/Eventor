export function safeRedirectPath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }

  return path;
}

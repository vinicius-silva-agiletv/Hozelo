/** Só aceita caminhos internos (evita redirecionamento para outro site). */
export function safeRedirectPath(path: string | null | undefined, fallback = '/') {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return fallback
  return path
}

/**
 * Tema claro/escuro seguindo a preferência do sistema: aplica a classe `dark` no <html>
 * (usada pelas variáveis de cor do shadcn/ui em index.css) e acompanha mudanças.
 */
export function followSystemTheme() {
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  const apply = () => document.documentElement.classList.toggle('dark', query.matches)

  apply()
  query.addEventListener('change', apply)

  return () => query.removeEventListener('change', apply)
}

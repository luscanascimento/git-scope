/**
 * Curated subset of GitHub's linguist language colours.
 * Falls back to a deterministic hue for unknown languages so the
 * charts always render with distinct, stable colours.
 */
const COLORS: Readonly<Record<string, string>> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Shell: '#89e051',
  Dockerfile: '#384d54',
  Lua: '#000080',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Scala: '#c22d40',
  Clojure: '#db5855',
  R: '#198CE7',
  Julia: '#a270ba',
  'Objective-C': '#438eff',
  Perl: '#0298c3',
  Zig: '#ec915c',
  Astro: '#ff5a03',
  Solidity: '#AA6746',
  MDX: '#fcb32c',
  Jupyter: '#DA5B0B',
  'Jupyter Notebook': '#DA5B0B',
  PowerShell: '#012456',
  Makefile: '#427819',
  Nix: '#7e7eff',
  OCaml: '#ef7a08',
  Assembly: '#6E4C13',
  CoffeeScript: '#244776',
  GDScript: '#355570',
  Vim: '#199f4b',
  'Vim Script': '#199f4b',
  TeX: '#3D6117',
};

/** Deterministic fallback colour derived from the language name. */
function fallbackColor(language: string): string {
  let hash = 0;
  for (let i = 0; i < language.length; i++) {
    hash = language.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 62%, 58%)`;
}

export function languageColor(language: string | null | undefined): string {
  if (!language) return '#8a94a6';
  return COLORS[language] ?? fallbackColor(language);
}

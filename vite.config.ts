import { defineConfig, loadEnv } from 'vite';

function normalizeBasePath(raw: string | undefined): string {
  if (!raw || raw.trim() === '') {
    return '/';
  }
  const trimmed = raw.trim();
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: normalizeBasePath(env.VITE_BASE_PATH),
    test: {
      include: ['src/**/*.test.ts'],
      environment: 'node',
      globals: true,
    },
  };
});

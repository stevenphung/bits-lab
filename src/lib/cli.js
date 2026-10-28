export const PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn', 'bun'];

const RUNNERS = { pnpm: 'pnpm dlx', npm: 'npx', yarn: 'yarn dlx', bun: 'bunx --bun' };
const ADDERS = { pnpm: 'pnpm add', npm: 'npm install', yarn: 'yarn add', bun: 'bun add' };

export function cliCommand(manager, registryUrl) {
  return `${RUNNERS[manager]} shadcn@latest add ${registryUrl}`;
}

export function manualCommand(manager, dependencies) {
  return dependencies.length ? `${ADDERS[manager]} ${dependencies.join(' ')}` : null;
}

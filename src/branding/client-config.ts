export type ClientId = 'verregassos' | 'calier';

export interface ClientBranding {
  id: ClientId;
  displayName: string;
  finalScreen: {
    projectsLabel: string;
    contactLabel: string;
    projectsUrl: string;
    contactUrl: string;
  };
}

export const DEFAULT_CLIENT_ID: ClientId = 'verregassos';

const CLIENT_BRANDING: Record<ClientId, ClientBranding> = {
  verregassos: {
    id: 'verregassos',
    displayName: 'Verregassos',
    finalScreen: {
      projectsLabel: 'VEURE MES PROJECTES',
      contactLabel: 'CONTACTA AMB ZEBA',
      projectsUrl: 'https://www.zeba.cat/projectes',
      contactUrl: 'https://zeba.cat/contacte/',
    },
  },
  calier: {
    id: 'calier',
    displayName: 'Calier',
    finalScreen: {
      projectsLabel: 'VEURE CALIER',
      contactLabel: 'CONTACTAR CALIER',
      projectsUrl: 'https://calier.com',
      contactUrl: 'https://calier.com/contacte',
    },
  },
};

export function resolveClientId(raw: string | null | undefined): ClientId {
  if (raw === 'calier') {
    return 'calier';
  }
  return DEFAULT_CLIENT_ID;
}

export function resolveClientIdFromWindow(): ClientId {
  if (typeof window === 'undefined') {
    return DEFAULT_CLIENT_ID;
  }
  const params = new URLSearchParams(window.location.search);
  return resolveClientId(params.get('client'));
}

export function getClientBranding(clientId: ClientId): ClientBranding {
  return CLIENT_BRANDING[clientId];
}

export function getClientAssetPath(clientId: ClientId, defaultPath: string, overridePath: string): string {
  return clientId === DEFAULT_CLIENT_ID ? defaultPath : `clients/${clientId}/${overridePath}`;
}

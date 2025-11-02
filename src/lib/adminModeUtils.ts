export type AdminMode = 'user' | 'preview' | 'edit';

const ADMIN_MODE_KEY = 'aerial-journey-admin-mode';

export const getAdminMode = (): AdminMode => {
  if (typeof window === 'undefined') return 'user';
  const saved = localStorage.getItem(ADMIN_MODE_KEY);
  return (saved as AdminMode) || 'user';
};

export const setAdminMode = (mode: AdminMode): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_MODE_KEY, mode);
};

export const getModeLabel = (mode: AdminMode): string => {
  switch (mode) {
    case 'user':
      return 'Tryb użytkownika';
    case 'preview':
      return 'Podgląd admina';
    case 'edit':
      return 'Edycja sportu';
    default:
      return 'Tryb użytkownika';
  }
};

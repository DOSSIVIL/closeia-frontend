export type LogoutReason = 'manual' | 'expired' | 'inactive' | 'revoked' | 'suspended' | 'other-tab';

export interface LogoutMessage {
  text: string;
  tone: 'info' | 'danger';
}

/** Messages affichés sur la page de connexion après une déconnexion. */
export const LOGOUT_MESSAGES: Record<LogoutReason, LogoutMessage> = {
  manual: { text: 'Vous avez été déconnecté.', tone: 'info' },
  expired: { text: 'Votre session a expiré. Reconnectez-vous pour continuer.', tone: 'info' },
  inactive: { text: 'Vous avez été déconnecté après une période d’inactivité.', tone: 'info' },
  revoked: {
    text: 'Votre session a été fermée (déconnexion depuis un autre appareil, ou par un administrateur). Reconnectez-vous.',
    tone: 'info',
  },
  suspended: { text: 'Votre compte a été suspendu. Contactez un administrateur.', tone: 'danger' },
  'other-tab': { text: 'Vous avez été déconnecté depuis un autre onglet.', tone: 'info' },
};

export function isLogoutReason(value: unknown): value is LogoutReason {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(LOGOUT_MESSAGES, value);
}

/** Code d'erreur renvoyé par le backend sur un 401 → raison de déconnexion. */
export function logoutReasonFromErrorCode(code: unknown): LogoutReason {
  switch (code) {
    case 'SESSION_REVOKED': return 'revoked';
    case 'ACCOUNT_SUSPENDED': return 'suspended';
    default: return 'expired';
  }
}
import { HttpErrorResponse } from '@angular/common/http';

export type GoogleErrorCode =
  | 'GOOGLE_POPUP_BLOCKED' | 'GOOGLE_SCRIPT_UNAVAILABLE' | 'GOOGLE_ACCESS_DENIED'
  | 'GOOGLE_CODE_INVALID' | 'GOOGLE_TOKEN_INVALID' | 'GOOGLE_EMAIL_NOT_VERIFIED'
  | 'GOOGLE_WORKSPACE_REQUIRED' | 'GOOGLE_ACCOUNT_CONFLICT'
  | 'EMAIL_FORMAT_INVALID' | 'EMAIL_DOMAIN_UNKNOWN' | 'SCHOOL_INACTIVE'
  | 'ACCOUNT_SUSPENDED' | 'ADMIN_ONLY_PORTAL'
  | 'RATE_LIMITED' | 'SERVER_UNREACHABLE' | 'SERVER_ERROR' | 'UNKNOWN';

export type ErrorTone = 'warning' | 'danger' | 'info';
export type ErrorIcon = 'window' | 'wifi' | 'lock' | 'mail' | 'user' | 'clock' | 'alert';

export interface GoogleErrorInfo {
  title: string;
  message: string;
  steps: readonly string[];
  tone: ErrorTone;
  icon: ErrorIcon;
  /** Affiche le bouton « Contacter l'administrateur ». */
  contactAdmin: boolean;
}

const CONTACT_STEP = 'Si le problème continue, contactez l’administrateur en indiquant la référence ci-dessous.';

export const GOOGLE_ERRORS: Record<GoogleErrorCode, GoogleErrorInfo> = {
  GOOGLE_POPUP_BLOCKED: {
    title: 'La fenêtre Google n’a pas pu s’ouvrir',
    message: 'Votre navigateur a bloqué la fenêtre de connexion Google.',
    steps: [
      'Autorisez les fenêtres pop-up pour ce site (icône dans la barre d’adresse).',
      'Revenez à la connexion et cliquez de nouveau sur « Se connecter avec Google ».',
    ],
    tone: 'warning', icon: 'window', contactAdmin: false,
  },
  GOOGLE_SCRIPT_UNAVAILABLE: {
    title: 'Google est inaccessible pour le moment',
    message: 'Le service de connexion Google n’a pas pu être chargé.',
    steps: [
      'Vérifiez votre connexion Internet.',
      'Désactivez temporairement un bloqueur de publicités ou de traqueurs.',
      'Réessayez dans quelques instants.',
    ],
    tone: 'warning', icon: 'wifi', contactAdmin: false,
  },
  GOOGLE_ACCESS_DENIED: {
    title: 'Autorisation refusée',
    message: 'Vous avez refusé l’accès à votre compte Google. L’application a besoin de votre nom et de votre adresse e-mail pour vous identifier.',
    steps: [
      'Revenez à la connexion et cliquez de nouveau sur le bouton Google.',
      'Acceptez l’autorisation demandée par Google.',
    ],
    tone: 'info', icon: 'user', contactAdmin: false,
  },
  GOOGLE_CODE_INVALID: {
    title: 'La connexion Google a expiré',
    message: 'L’autorisation reçue de Google n’est plus valide : elle expire très rapidement.',
    steps: ['Revenez à la connexion et cliquez de nouveau sur le bouton Google.', CONTACT_STEP],
    tone: 'warning', icon: 'clock', contactAdmin: true,
  },
  GOOGLE_TOKEN_INVALID: {
    title: 'Identité Google non reconnue',
    message: 'Google n’a pas pu confirmer votre identité.',
    steps: ['Revenez à la connexion et réessayez.', CONTACT_STEP],
    tone: 'danger', icon: 'lock', contactAdmin: true,
  },
  GOOGLE_EMAIL_NOT_VERIFIED: {
    title: 'Adresse Google non vérifiée',
    message: 'Google n’a pas confirmé que cette adresse e-mail vous appartient.',
    steps: ['Utilisez le compte Google fourni par votre établissement.', CONTACT_STEP],
    tone: 'danger', icon: 'mail', contactAdmin: true,
  },
  GOOGLE_WORKSPACE_REQUIRED: {
    title: 'Ce compte Google n’est pas celui de votre établissement',
    message: 'La connexion exige le compte Google de votre établissement, pas un compte personnel (Gmail, par exemple).',
    steps: [
      'Revenez à la connexion et cliquez sur le bouton Google.',
      'Dans la fenêtre Google, choisissez « Utiliser un autre compte ».',
      'Saisissez l’adresse de votre établissement, au format prenom.nom@domaine.',
    ],
    tone: 'warning', icon: 'mail', contactAdmin: true,
  },
  GOOGLE_ACCOUNT_CONFLICT: {
    title: 'Adresse déjà associée à un autre compte Google',
    message: 'Cette adresse est déjà liée à une autre identité Google.',
    steps: [
      'Utilisez le compte Google avec lequel vous vous êtes connecté la première fois.',
      'Sinon, demandez à l’administrateur de réinitialiser cette liaison.',
    ],
    tone: 'danger', icon: 'user', contactAdmin: true,
  },
  EMAIL_FORMAT_INVALID: {
    title: 'Adresse e-mail non conforme',
    message: 'Les adresses de l’établissement suivent le format prenom.nom@domaine : lettres sans accent et un seul point entre le prénom et le nom.',
    steps: [
      'Vérifiez l’adresse utilisée, affichée ci-dessus.',
      'Choisissez le bon compte Google, ou demandez à l’administrateur de corriger votre adresse.',
    ],
    tone: 'warning', icon: 'mail', contactAdmin: true,
  },
  EMAIL_DOMAIN_UNKNOWN: {
    title: 'Ce domaine n’est pas reconnu',
    message: 'L’adresse utilisée n’appartient à aucun établissement enregistré.',
    steps: [
      'Utilisez l’adresse fournie par votre établissement.',
      'Si elle est correcte, demandez à l’administrateur d’enregistrer votre établissement.',
    ],
    tone: 'warning', icon: 'mail', contactAdmin: true,
  },
  SCHOOL_INACTIVE: {
    title: 'Établissement désactivé',
    message: 'L’accès est actuellement suspendu pour votre établissement.',
    steps: ['Contactez l’administrateur de la plateforme pour en connaître la raison.'],
    tone: 'danger', icon: 'lock', contactAdmin: true,
  },
  ACCOUNT_SUSPENDED: {
    title: 'Compte suspendu',
    message: 'Votre accès a été suspendu par un administrateur.',
    steps: ['Contactez l’administrateur pour connaître la raison et demander la réactivation.'],
    tone: 'danger', icon: 'lock', contactAdmin: true,
  },
  ADMIN_ONLY_PORTAL: {
    title: 'Accès réservé aux administrateurs',
    message: 'Ce portail sert à administrer la plateforme. Votre compte est bien reconnu, mais il n’a pas de rôle d’administrateur.',
    steps: [
      'Pour discuter avec l’assistant et consulter vos documents, utilisez l’application mobile.',
      'Si vous devez administrer votre établissement, demandez un rôle d’administrateur.',
    ],
    tone: 'info', icon: 'user', contactAdmin: true,
  },
  RATE_LIMITED: {
    title: 'Trop de tentatives',
    message: 'Pour votre sécurité, les connexions sont temporairement limitées.',
    steps: ['Patientez une minute, puis réessayez.'],
    tone: 'warning', icon: 'clock', contactAdmin: false,
  },
  SERVER_UNREACHABLE: {
    title: 'Serveur injoignable',
    message: 'Impossible de joindre le serveur de l’application.',
    steps: ['Vérifiez votre connexion Internet.', 'Réessayez dans quelques minutes.', CONTACT_STEP],
    tone: 'warning', icon: 'wifi', contactAdmin: true,
  },
  SERVER_ERROR: {
    title: 'Un problème est survenu de notre côté',
    message: 'Le serveur a rencontré une erreur pendant votre connexion.',
    steps: ['Réessayez dans quelques minutes.', CONTACT_STEP],
    tone: 'danger', icon: 'alert', contactAdmin: true,
  },
  UNKNOWN: {
    title: 'Connexion impossible',
    message: 'Une erreur inattendue est survenue pendant la connexion avec Google.',
    steps: ['Revenez à la connexion et réessayez.', CONTACT_STEP],
    tone: 'danger', icon: 'alert', contactAdmin: true,
  },
};

/** Tracés SVG (viewBox 24, trait) de chaque icône. */
export const GOOGLE_ERROR_ICONS: Record<ErrorIcon, readonly string[]> = {
  window: ['M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M3 9h18', 'M7 6.5h.01'],
  wifi: ['M12 20h.01', 'M8.5 16.4a5 5 0 0 1 7 0', 'M5 12.9a10 10 0 0 1 5.2-2.7', 'M19 12.9a10 10 0 0 0-2-1.5', 'M2 8.8a15 15 0 0 1 4.2-2.6', 'M22 8.8a15 15 0 0 0-11.3-3.8', 'm2 2 20 20'],
  lock: ['M7 11V7a5 5 0 0 1 10 0v4', 'M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z'],
  mail: ['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'm22 6-10 7L2 6'],
  user: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'm17 8 5 5', 'm22 8-5 5'],
  clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2'],
  alert: ['M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
};

export function isGoogleErrorCode(value: unknown): value is GoogleErrorCode {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(GOOGLE_ERRORS, value);
}

/** Tout code inconnu (par exemple saisi à la main dans l'URL) devient « UNKNOWN ». */
export function normalizeGoogleErrorCode(value: unknown): GoogleErrorCode {
  return isGoogleErrorCode(value) ? value : 'UNKNOWN';
}

/** Transforme une erreur (réponse du backend ou erreur du navigateur) en code affichable. */
export function resolveGoogleErrorCode(err: unknown): GoogleErrorCode {
  if (err instanceof HttpErrorResponse) {
    const code = (err.error as { code?: unknown } | null)?.code;
    if (isGoogleErrorCode(code)) return code;
    if (err.status === 0) return 'SERVER_UNREACHABLE';
    if (err.status === 429) return 'RATE_LIMITED';
    if (err.status >= 500) return 'SERVER_ERROR';
    return 'UNKNOWN';
  }
  switch (err instanceof Error ? err.message : '') {
    case 'popup_failed_to_open': return 'GOOGLE_POPUP_BLOCKED';
    case 'script_load_failed': return 'GOOGLE_SCRIPT_UNAVAILABLE';
    case 'access_denied': return 'GOOGLE_ACCESS_DENIED';
    default: return 'UNKNOWN';
  }
}

/** Compte Google utilisé, si le backend l'a renvoyé. */
export function extractErrorEmail(err: unknown): string | undefined {
  if (!(err instanceof HttpErrorResponse)) return undefined;
  const email = (err.error as { details?: { email?: unknown } } | null)?.details?.email;
  return typeof email === 'string' && email.length <= 254 ? email : undefined;
}
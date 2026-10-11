export interface AuthUser {
  id: number;
  name: string;
  email: string;
  emailVerified: boolean;
}

export interface AuthResult {
  user: AuthUser;
}

export interface SessionResult extends AuthResult {
  sessionId: string;
  expiresAt: Date;
}

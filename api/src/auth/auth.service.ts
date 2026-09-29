import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CookieOptions } from 'express';
import { GoogleProfile } from './google-profile';
import { UsersService } from '../users/users.service';

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  get configured(): boolean {
    return Boolean(
      this.config.get<string>('GOOGLE_CLIENT_ID') &&
        this.config.get<string>('GOOGLE_CLIENT_SECRET'),
    );
  }

  webOrigin(): string {
    return this.allowedOrigins()[0] ?? 'http://localhost:2202';
  }

  signState(returnTo: string): string {
    return this.jwt.sign({ returnTo }, { expiresIn: '10m' });
  }

  returnToFromState(state?: string): string {
    if (!state) {
      return this.webOrigin();
    }
    try {
      const payload = this.jwt.verify<{ returnTo?: string }>(state);
      return this.sanitizeReturnTo(payload.returnTo);
    } catch {
      return this.webOrigin();
    }
  }

  sanitizeReturnTo(value?: string): string {
    const fallback = this.webOrigin();
    if (!value) {
      return fallback;
    }
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return fallback;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return fallback;
    }
    if (!this.allowedOrigins().includes(url.origin)) {
      return fallback;
    }
    return url.toString();
  }

  async upsertFromGoogle(profile: GoogleProfile) {
    const user = await this.users.upsertFromGoogle(profile);
    return this.users.toProfile(user);
  }

  signSession(user: { id: string; email: string; role: string }): string {
    return this.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' },
    );
  }

  sessionCookieOptions(): CookieOptions {
    return {
      ...this.cookieBase(),
      maxAge: SESSION_MAX_AGE_MS,
    };
  }

  clearCookieOptions(): CookieOptions {
    return this.cookieBase();
  }

  private cookieBase(): CookieOptions {
    const domain = this.config.get<string>('COOKIE_DOMAIN')?.trim();
    return {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
      ...(domain ? { domain } : {}),
    };
  }

  private allowedOrigins(): string[] {
    const raw = [
      this.config.get<string>('WEB_ORIGIN'),
      this.config.get<string>('ADMIN_ORIGIN'),
      this.config.get<string>('CORS_ORIGINS'),
    ]
      .filter((value): value is string => Boolean(value))
      .flatMap((value) => value.split(','))
      .map((value) => value.trim())
      .filter(Boolean);

    return [...new Set(raw)];
  }
}

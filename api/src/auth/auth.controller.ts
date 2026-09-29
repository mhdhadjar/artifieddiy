import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import passport from 'passport';
import { AuthService } from './auth.service';
import { GoogleProfile } from './google-profile';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('google')
  google(
    @Req() req: Request,
    @Res() res: Response,
    @Query('returnTo') returnTo?: string,
  ) {
    if (!this.auth.configured) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }
    const state = this.auth.signState(this.auth.sanitizeReturnTo(returnTo));
    passport.authenticate('google', {
      scope: ['email', 'profile'],
      session: false,
      state,
    })(req, res);
  }

  @Get('google/callback')
  callback(
    @Req() req: Request,
    @Res() res: Response,
    @Query('state') state?: string,
  ) {
    passport.authenticate(
      'google',
      { session: false },
      (err: Error | null, profile: GoogleProfile | false) => {
        void this.finish(err, profile, state, res);
      },
    )(req, res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request) {
    return req.user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('artified_session', this.auth.clearCookieOptions());
    return { ok: true };
  }

  private async finish(
    err: Error | null,
    profile: GoogleProfile | false,
    state: string | undefined,
    res: Response,
  ) {
    const failed = `${this.auth.webOrigin()}/?auth=failed`;
    try {
      if (err || !profile) {
        res.redirect(failed);
        return;
      }
      const user = await this.auth.upsertFromGoogle(profile);
      const token = this.auth.signSession(user);
      res.cookie('artified_session', token, this.auth.sessionCookieOptions());
      res.redirect(this.auth.returnToFromState(state));
    } catch {
      res.redirect(failed);
    }
  }
}

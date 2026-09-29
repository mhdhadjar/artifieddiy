import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GoogleProfile } from '../auth/google-profile';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly config: ConfigService,
  ) {}

  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.users.findById(id).exec();
  }

  async upsertFromGoogle(profile: GoogleProfile): Promise<UserDocument> {
    const email = profile.email.toLowerCase();
    let user =
      (await this.users.findOne({ googleId: profile.googleId }).exec()) ??
      (await this.users.findOne({ email }).exec());

    if (!user) {
      user = new this.users({
        googleId: profile.googleId,
        email,
        name: profile.name,
        picture: profile.picture,
        role: this.isAdminEmail(email) ? 'admin' : 'user',
      });
    } else {
      user.googleId = profile.googleId;
      user.email = email;
      user.name = profile.name;
      user.picture = profile.picture;
      if (this.isAdminEmail(email)) {
        user.role = 'admin';
      }
    }

    return user.save();
  }

  toProfile(user: UserDocument) {
    return {
      id: user.id as string,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
    };
  }

  private isAdminEmail(email: string): boolean {
    const list = (this.config.get<string>('ADMIN_EMAILS') ?? '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
    return list.includes(email.toLowerCase());
  }
}

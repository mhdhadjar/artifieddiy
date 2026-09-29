import { UserRole } from '../users/user.schema';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      picture: string;
      role: UserRole;
    }
  }
}

export {};

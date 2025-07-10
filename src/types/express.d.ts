import type { ServiceContainer } from '../utils/container';
import type { DbUser } from '../modules/auth/models/user';
import { Multer as _Multer } from 'multer';

declare module 'express-serve-static-core' {
  interface Request {
    services: ServiceContainer;
    user?: DbUser;
    file?: Express.Multer.File;
  }
}

export {};

import { settings } from '../config/config';
export const cookieOptions = () => ({
  httpOnly: true,
  secure: settings().production,
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
});

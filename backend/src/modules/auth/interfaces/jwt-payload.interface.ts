import { UserRole } from '../../../common/enums';

export interface JwtPayload {
  sub: string;
  clinicaId: string;
  role: UserRole;
  email: string;
}

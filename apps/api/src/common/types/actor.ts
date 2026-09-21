import { ActorType, UserRole } from '@prisma/client';

/// Quem esta fazendo a requisicao. Um usuario do painel e um funcionario do
/// app percorrem os mesmos guards, entao o tipo carrega os dois casos.
export interface Actor {
  type: ActorType;
  id: string;
  companyId: string;
  name: string;
  /// Apenas para type = USER.
  role?: UserRole;
  /// Apenas para type = EMPLOYEE.
  deviceId?: string;
}

export interface JwtPayload {
  sub: string;
  typ: ActorType;
  cid: string;
  name: string;
  role?: UserRole;
  did?: string;
}

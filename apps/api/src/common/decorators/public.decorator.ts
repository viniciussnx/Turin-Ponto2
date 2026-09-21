import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/// Marca uma rota como acessivel sem token.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

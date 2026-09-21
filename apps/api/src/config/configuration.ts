export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiPrefix: string;
  corsOrigins: string[];
  jwt: {
    secret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  sync: {
    enabled: boolean;
    /// Proxy Analista-DP: a porta de entrada somente leitura para o Alterdata
    /// Pack. É a mesma integração que o sistema de férias usa — um único ponto
    /// de contato com o ERP, em vez de cada app abrir sua conexão ao Postgres.
    proxy: {
      baseUrl: string;
      apiKey: string;
      company: string;
      timeoutMs: number;
    };
  };
  storage: {
    driver: 'local' | 's3';
    localPath: string;
    s3: {
      endpoint: string;
      bucket: string;
      accessKey: string;
      secretKey: string;
      region: string;
    };
  };
}

const bool = (value: string | undefined, fallback = false): boolean =>
  value === undefined ? fallback : ['1', 'true', 'yes'].includes(value.toLowerCase());

export default (): AppConfig => ({
  port: Number(process.env.PORT ?? 3333),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiPrefix: process.env.API_PREFIX ?? 'api',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-nao-use-em-producao',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  },
  sync: {
    enabled: bool(process.env.EMPLOYEE_SYNC_ENABLED),
    proxy: {
      baseUrl: process.env.PROXY_API_URL ?? 'https://proxy-analista-dp.up.railway.app/api',
      apiKey: process.env.PROXY_API_KEY ?? '',
      company: process.env.ALTERDATA_EMPRESA ?? '00001',
      timeoutMs: Number(process.env.PROXY_TIMEOUT_MS ?? 60_000),
    },
  },
  storage: {
    driver: (process.env.STORAGE_DRIVER as 'local' | 's3') ?? 'local',
    localPath: process.env.STORAGE_LOCAL_PATH ?? './storage',
    s3: {
      endpoint: process.env.S3_ENDPOINT ?? '',
      bucket: process.env.S3_BUCKET ?? 'turin-ponto',
      accessKey: process.env.S3_ACCESS_KEY ?? '',
      secretKey: process.env.S3_SECRET_KEY ?? '',
      region: process.env.S3_REGION ?? 'us-east-1',
    },
  },
});

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setSessionExpiredHandler } from '../api/client';
import { getDeviceInfo } from '../device/installation';
import { clearTokens, loadTokens, saveTokens } from './token-store';

export interface Employee {
  id: string;
  name: string;
  registration: string;
  position: string | null;
  photoUrl: string | null;
  timezone: string;
  company: { id: string; name: string };
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  mustChangePassword: boolean;
  employee: Employee;
}

interface AuthValue {
  /// `null` enquanto ainda estamos lendo o armazenamento seguro no boot.
  employee: Employee | null;
  mustChangePassword: boolean;
  ready: boolean;
  signIn(registration: string, password: string, keepSignedIn: boolean): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  signOut(): Promise<void>;
  /// Matrícula do último login, para pré-preencher o campo.
  lastRegistration: string | null;
}

const EMPLOYEE_KEY = 'turin.employee';
const LAST_REGISTRATION_KEY = 'turin.lastRegistration';

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [lastRegistration, setLastRegistration] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const signOut = useCallback(async () => {
    // Avisa o servidor para revogar a sessão, mas nunca deixa a falha de rede
    // prender o usuário dentro do app: o estado local é limpo de qualquer forma.
    try {
      const tokens = await loadTokens();
      if (tokens) {
        await api('/auth/logout', {
          method: 'POST',
          body: { refreshToken: tokens.refreshToken },
          anonymous: true,
        });
      }
    } catch {
      // silencioso de propósito
    }
    await Promise.all([clearTokens(), AsyncStorage.removeItem(EMPLOYEE_KEY)]);
    setEmployee(null);
    setMustChangePassword(false);
  }, []);

  // Restaura a sessão no boot e registra o que fazer quando o refresh falhar.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setEmployee(null);
      setMustChangePassword(false);
    });

    void (async () => {
      try {
        const [tokens, cached, last] = await Promise.all([
          loadTokens(),
          AsyncStorage.getItem(EMPLOYEE_KEY),
          AsyncStorage.getItem(LAST_REGISTRATION_KEY),
        ]);
        setLastRegistration(last);
        // O perfil vem do cache para a home abrir offline. O token é que manda
        // na sessão — sem ele, o cache é ignorado.
        if (tokens && cached) setEmployee(JSON.parse(cached) as Employee);
      } finally {
        setReady(true);
      }
    })();

    return () => setSessionExpiredHandler(null);
  }, []);

  const signIn = useCallback(
    async (registration: string, password: string, keepSignedIn: boolean) => {
      const device = await getDeviceInfo();
      const result = await api<LoginResponse>('/auth/employee/login', {
        method: 'POST',
        anonymous: true,
        body: { registration: registration.trim(), password, device, keepSignedIn },
      });

      await Promise.all([
        saveTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken }),
        AsyncStorage.setItem(EMPLOYEE_KEY, JSON.stringify(result.employee)),
        AsyncStorage.setItem(LAST_REGISTRATION_KEY, result.employee.registration),
      ]);

      setLastRegistration(result.employee.registration);
      setMustChangePassword(result.mustChangePassword);
      setEmployee(result.employee);
    },
    [],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      await api('/auth/employee/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      });
      // O servidor derruba todas as sessões ao trocar a senha, inclusive esta.
      // Voltar ao login com a senha nova é o comportamento correto.
      await signOut();
    },
    [signOut],
  );

  const value = useMemo<AuthValue>(
    () => ({
      employee,
      mustChangePassword,
      ready,
      signIn,
      changePassword,
      signOut,
      lastRegistration,
    }),
    [employee, mustChangePassword, ready, signIn, changePassword, signOut, lastRegistration],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return value;
}

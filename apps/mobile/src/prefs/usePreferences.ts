import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/// Preferências do app, por aparelho.
///
/// Ficam em AsyncStorage e não no servidor de propósito: são escolhas de uso
/// deste celular (tema, lembretes locais), não dados do funcionário. Se ele
/// trocar de aparelho, começar do padrão é o comportamento certo.

export interface Preferences {
  push: boolean;
  reminders: boolean;
  darkMode: boolean | null;
  biometrics: boolean;
}

const DEFAULTS: Preferences = {
  push: true,
  reminders: true,
  /// `null` = segue o sistema. É o padrão do protótipo.
  darkMode: null,
  biometrics: false,
};

const KEY = 'turin.preferences';

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setPrefs({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Preferences>) });
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const update = useCallback(async (patch: Partial<Preferences>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      void AsyncStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { prefs, update, ready };
}

export interface Reminder {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  weekdays: number[];
}

const REMINDERS_KEY = 'turin.reminders';

/// Lembretes padrão, espelhando os do protótipo (tela 14).
const DEFAULT_REMINDERS: Reminder[] = [
  { id: 'entrada', time: '06:38', label: 'Entrada', enabled: true, weekdays: [1, 2, 3, 4, 5] },
  { id: 'intervalo', time: '11:38', label: 'Intervalo', enabled: true, weekdays: [1, 2, 3, 4, 5] },
  { id: 'retorno', time: '12:38', label: 'Retorno', enabled: false, weekdays: [1, 2, 3, 4, 5] },
  { id: 'saida', time: '15:18', label: 'Saída', enabled: true, weekdays: [1, 2, 3, 4, 5] },
];

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>(DEFAULT_REMINDERS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(REMINDERS_KEY);
        if (raw) setReminders(JSON.parse(raw) as Reminder[]);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const toggle = useCallback((id: string) => {
    setReminders((current) => {
      const next = current.map((reminder) =>
        reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder,
      );
      void AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setTime = useCallback((id: string, time: string) => {
    setReminders((current) => {
      const next = current.map((reminder) =>
        reminder.id === id ? { ...reminder, time } : reminder,
      );
      void AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { reminders, toggle, setTime, ready };
}

export const WEEKDAY_NAMES = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function weekdaysLabel(weekdays: number[]): string {
  if (weekdays.length === 7) return 'todos os dias';
  if (weekdays.length === 5 && weekdays.every((day) => day >= 1 && day <= 5)) {
    return 'seg a sex';
  }
  return weekdays.map((day) => WEEKDAY_NAMES[day]).join(', ');
}

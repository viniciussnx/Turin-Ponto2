import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { fonts, radius, spacing } from '../src/theme/tokens';
import { Icon } from '../src/components/Icon';
import { Card, ProvisionalNotice, Screen, SectionLabel } from '../src/components/layout';
import { getNotifications, type AppNotification } from '../src/api/roster';

/// Tela 10 do protótipo — notificações.
export default function NotificationsScreen() {
  const { c } = useTheme();
  const items = useMemo(() => getNotifications(), []);

  // Agrupa preservando a ordem em que os grupos aparecem.
  const groups = useMemo(() => {
    const map = new Map<string, AppNotification[]>();
    for (const item of items) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return [...map.entries()];
  }, [items]);

  const unread = items.filter((item) => item.unread).length;

  return (
    <Screen
      title="Notificações"
      subtitle={unread > 0 ? `${unread} não lidas` : 'Tudo em dia'}
    >
      <View style={{ gap: spacing.lg }}>
        <ProvisionalNotice>
          Lista de demonstração. O envio de notificações ainda não existe no servidor — o
          app já guarda o token de push do aparelho no login.
        </ProvisionalNotice>

        {groups.map(([group, list]) => (
          <View key={group} style={{ gap: spacing.sm }}>
            <SectionLabel>{group}</SectionLabel>
            {list.map((item) => (
              <Card key={item.id} highlighted={item.unread} style={{ padding: spacing.md }}>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: radius.md,
                      backgroundColor: toneBg(item.tone, c),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={item.icon} color={toneInk(item.tone, c)} size={19} />
                  </View>

                  <View style={{ flex: 1, gap: 2 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.sm,
                      }}
                    >
                      <Text
                        style={{
                          flex: 1,
                          color: c.text,
                          fontFamily: fonts.semibold,
                          fontSize: 15,
                        }}
                      >
                        {item.title}
                      </Text>
                      {item.unread ? (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: c.brand,
                          }}
                        />
                      ) : null}
                    </View>

                    <Text
                      style={{
                        color: c.text2,
                        fontFamily: fonts.regular,
                        fontSize: 13,
                        lineHeight: 19,
                      }}
                    >
                      {item.body}
                    </Text>
                    <Text
                      style={{
                        color: c.muted,
                        fontFamily: fonts.regular,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {item.time}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ))}
      </View>
    </Screen>
  );
}

type Palette = { brandSoft: string; brandInk: string; warn: string; bad: string; surface2: string; text2: string };

function toneBg(tone: AppNotification['tone'], c: Palette): string {
  return {
    ok: c.brandSoft,
    warn: 'rgba(217,138,0,0.12)',
    bad: 'rgba(214,69,69,0.10)',
    neutral: c.surface2,
  }[tone];
}

function toneInk(tone: AppNotification['tone'], c: Palette): string {
  return { ok: c.brandInk, warn: c.warn, bad: c.bad, neutral: c.text2 }[tone];
}

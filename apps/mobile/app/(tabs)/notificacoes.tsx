import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { fonts } from '../../src/theme/tokens';
import { IconChip, SectionLabel, TopBar } from '../../src/components/layout';
import { getNotifications, type AppNotification } from '../../src/api/roster';

/// Tela 10 do protótipo — notificações agrupadas por dia.
export default function NotificationsScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const [lidas, setLidas] = useState(false);
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

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        title="Notificações"
        onBack={() => (router.canGoBack() ? router.back() : router.navigate('/inicio'))}
        right={
          <Pressable onPress={() => setLidas(true)} hitSlop={12} accessibilityRole="button">
            <Text style={{ color: c.brandInk, fontFamily: fonts.semibold, fontSize: 13 }}>Marcar lidas</Text>
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18, gap: 9 }}>
        {groups.map(([group, list]) => (
          <View key={group} style={{ gap: 9 }}>
            <SectionLabel style={{ marginTop: 6, marginBottom: -1 }}>{group}</SectionLabel>
            {list.map((item) => (
              <Cartao key={item.id} item={item} naoLida={item.unread && !lidas} />
            ))}
          </View>
        ))}

        <Text style={{ marginTop: 10, textAlign: 'center', color: c.muted, fontFamily: fonts.regular, fontSize: 11.5, lineHeight: 16 }}>
          Lista de demonstração: o envio de notificações ainda não existe no servidor.
        </Text>
      </ScrollView>
    </View>
  );
}

/// `padding:14px 15px; border-radius:16px`; ícone de 36 pt; título `600 14px`
/// com a bolinha verde de não lida; texto `400 12.5px/1.5`; hora `500 11px`.
function Cartao({ item, naoLida }: { item: AppNotification; naoLida: boolean }) {
  const { c } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 15,
        borderRadius: 16,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: naoLida && item.tone === 'ok' ? c.brandLine : c.line2,
      }}
    >
      <IconChip icon={item.icon} tone={item.tone} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Text style={{ flexShrink: 1, color: c.text, fontFamily: fonts.semibold, fontSize: 14 }}>{item.title}</Text>
          {naoLida ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.brand }} /> : null}
        </View>
        <Text style={{ marginTop: 3, color: c.text2, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18.75 }}>
          {item.body}
        </Text>
        <Text style={{ marginTop: 6, color: c.muted, fontFamily: fonts.medium, fontSize: 11 }}>{item.time}</Text>
      </View>
    </View>
  );
}

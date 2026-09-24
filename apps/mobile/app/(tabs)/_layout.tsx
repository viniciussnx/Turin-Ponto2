import { Tabs } from 'expo-router';
import { ABAS, OCULTAS, TabBar } from '../../src/components/TabBar';

/// Barra de abas do protótipo: Início, Ponto, Escala, Pedidos, Perfil.
/// `ajustes` (tela 15) e `notificacoes` (tela 10) moram aqui, sem botão
/// próprio, porque o protótipo as mostra com a barra visível.
export default function TabsLayout() {
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      {ABAS.map((aba) => (
        <Tabs.Screen key={aba.name} name={aba.name} options={{ title: aba.label }} />
      ))}
      {Object.keys(OCULTAS).map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}

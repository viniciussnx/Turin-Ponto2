import { ProvisionalNotice, View } from '@turin/mobile-ds';

export const Escala = () => (
  <View style={{ width: 358 }}>
    <ProvisionalNotice>
      Escala de demonstração. Turno, linha e veículo ainda não vêm do servidor — o Alterdata não
      expõe esses dados hoje.
    </ProvisionalNotice>
  </View>
);

export const Gestor = () => (
  <View style={{ width: 358 }}>
    <ProvisionalNotice>
      Dados de demonstração. A visão de gestor precisa de um perfil de encarregado no servidor, que
      ainda não existe para o app.
    </ProvisionalNotice>
  </View>
);

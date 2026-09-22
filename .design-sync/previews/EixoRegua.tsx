import { EixoRegua, ReguaDia, View } from '@turin/mobile-ds';

export const SobARegua = () => (
  <View style={{ width: 326 }}>
    <ReguaDia marcacoes={['05:40', '09:58', '11:02', '14:58']} altura={10} />
    <EixoRegua />
  </View>
);

export const Sozinho = () => (
  <View style={{ width: 326 }}>
    <EixoRegua />
  </View>
);

import type { ReactNode } from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { Icon } from './Icon';

/*
 * Mapa ilustrativo das telas 04 e 12 do protótipo: grade de 44/58 pt, duas
 * ruas inclinadas, o círculo da cerca e o pino. É desenho, não mapa real —
 * o app não carrega tiles de mapa (nem precisa, para bater ponto).
 */
export function MapaCerca({
  altura,
  grade = 44,
  raio,
  pino = 'circulo',
  centroY = 0.5,
  style,
  children,
}: {
  /// Omitido: ocupa o espaço do pai (`flex: 1`).
  altura?: number;
  grade?: number;
  /// Diâmetro do círculo da cerca.
  raio: number;
  /// `circulo`: bolinha de 34 pt com ícone (tela 04). `gota`: pino em gota (tela 12).
  pino?: 'circulo' | 'gota';
  /// Posição vertical do centro (0–1).
  centroY?: number;
  style?: ViewStyle;
  children?: ReactNode;
}) {
  const { c } = useTheme();
  const linhas = Array.from({ length: 24 });

  return (
    <View
      style={[
        {
          height: altura,
          flex: altura ? undefined : 1,
          borderRadius: altura ? 18 : 20,
          overflow: 'hidden',
          backgroundColor: c.surface2,
          borderWidth: 1,
          borderColor: c.line2,
        },
        style,
      ]}
    >
      {/* Grade */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.28 }} pointerEvents="none">
        {linhas.map((_, i) => (
          <View key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: i * grade + grade / 2, width: 1, backgroundColor: c.line }} />
        ))}
        {linhas.map((_, i) => (
          <View key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: i * grade + grade / 2, height: 1, backgroundColor: c.line }} />
        ))}
      </View>

      {/* Ruas */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: -40,
          top: altura ? 64 : '48%',
          width: 560,
          height: altura ? 16 : 22,
          backgroundColor: c.line,
          transform: [{ rotate: altura ? '-7deg' : '-14deg' }],
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: altura ? 120 : 96,
          top: -30,
          width: 14,
          height: 700,
          backgroundColor: c.line2,
          transform: [{ rotate: altura ? '9deg' : '7deg' }],
        }}
      />
      {altura ? null : (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 236,
            top: -30,
            width: 12,
            height: 700,
            backgroundColor: c.line2,
            transform: [{ rotate: '-5deg' }],
          }}
        />
      )}

      {/* Cerca + pino */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${centroY * 100}%`,
          alignItems: 'center',
          transform: [{ translateY: -raio / 2 }],
        }}
      >
        <View
          style={{
            width: raio,
            height: raio,
            borderRadius: raio / 2,
            backgroundColor: c.brandSoft,
            borderWidth: pino === 'gota' ? 1.5 : 1,
            borderColor: c.brandLine,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {pino === 'circulo' ? (
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: c.brand,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#0BAF29',
                shadowOpacity: 0.6,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 5 },
              }}
            >
              <Icon name="pin" color={c.text} size={19} strokeWidth={2} />
            </View>
          ) : (
            <View
              style={{
                width: 34,
                height: 34,
                borderTopLeftRadius: 17,
                borderTopRightRadius: 17,
                borderBottomRightRadius: 17,
                backgroundColor: c.brand,
                transform: [{ translateY: -22 }, { rotate: '-45deg' }],
                shadowColor: '#0BAF29',
                shadowOpacity: 0.6,
                shadowRadius: 7,
                shadowOffset: { width: 0, height: 6 },
              }}
            />
          )}
        </View>
      </View>

      {children}
    </View>
  );
}

/// Etiqueta branca sobre o mapa ("Garagem Contagem · 32 m").
export function EtiquetaMapa({ texto, ponto }: { texto: string; ponto?: 'ok' | 'warn' }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 32,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.line,
        alignSelf: 'flex-start',
      }}
    >
      {ponto ? (
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: ponto === 'ok' ? c.ok : c.warn }} />
      ) : (
        <Icon name="pin" color={c.text} size={15} strokeWidth={2} />
      )}
      <Text numberOfLines={1} style={{ color: c.text, fontFamily: fonts.semibold, fontSize: 12 }}>{texto}</Text>
    </View>
  );
}

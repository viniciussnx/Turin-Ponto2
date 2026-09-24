import Svg, { Circle, Path } from 'react-native-svg';

/// Ícones do protótipo, com os traços copiados do sprite `<symbol id="ic-…">`
/// de `design/Meu Ponto Turin.dc.html` (viewBox 24, traço 1,8, pontas
/// arredondadas). Os nomes são os do app; o comentário ao lado é o id no
/// protótipo, para conferir tela contra tela.
export type IconName =
  | 'home'
  | 'clock'
  | 'mirror'
  | 'inbox'
  | 'user'
  | 'pin'
  | 'face'
  | 'check'
  | 'swap'
  | 'doc'
  | 'calendar'
  | 'alert'
  | 'bell'
  | 'moon'
  | 'shield'
  | 'coffee'
  | 'bus'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-right'
  | 'chevron-left'
  | 'plus'
  | 'camera'
  | 'lock'
  | 'logout'
  | 'eye'
  | 'eye-off'
  | 'filter'
  | 'cloud'
  | 'x';

interface IconProps {
  name: IconName;
  color: string;
  size?: number;
  strokeWidth?: number;
}

const D: Record<Exclude<IconName, 'clock' | 'pin' | 'user' | 'camera' | 'eye' | 'eye-off'>, string> = {
  home: 'M3 10.6 12 3.2l9 7.4V21h-6.2v-6.1H9.2V21H3z', // ic-home
  mirror: 'M3.6 5.6h16.8v14.8H3.6zM3.6 9.8h16.8M8 3v4.4M16 3v4.4M8.6 14.6l2.2 2.2 4.4-4.4', // ic-mirror
  inbox: 'M3.4 13.4h5l1.2 2.2h4.8l1.2-2.2h5M3.4 13.4 6.4 4.6h11.2l3 8.8v6H3.4z', // ic-inbox
  bell: 'M18 16.2v-4.8a6 6 0 0 0-12 0v4.8l-2 2h16zM10 20.2a2 2 0 0 0 4 0', // ic-bell
  'chevron-left': 'M14.8 4.8 7.6 12l7.2 7.2', // ic-chev-l
  'chevron-right': 'M9.2 4.8 16.4 12l-7.2 7.2', // ic-chev-r
  'chevron-down': 'M4.8 9.2 12 16.4l7.2-7.2', // ic-chev-d
  'chevron-up': 'M4.8 14.8 12 7.6l7.2 7.2', // ic-chev-u
  check: 'M4.4 12.6 9.4 17.6 19.8 6.8', // ic-check
  plus: 'M12 5v14M5 12h14', // ic-plus
  alert: 'M12 3.4 2.8 20.2h18.4zM12 9.4v4.6M12 17.2h.02', // ic-alert
  bus: 'M4.4 4.6h15.2v11.2H4.4zM4.4 9.4h15.2M7.4 15.8v2.6M16.6 15.8v2.6M8 12.8h.02M16 12.8h.02', // ic-bus
  moon: 'M20.2 14.4A8.4 8.4 0 1 1 9.6 3.8a7.2 7.2 0 0 0 10.6 10.6z', // ic-moon
  logout: 'M14.4 4h5.2v16h-5.2M10.8 8.2 6.6 12.4l4.2 4.2M6.6 12.4h9.2', // ic-out
  doc: 'M6.2 3.2h7.6l4 4v13.6H6.2zM13.8 3.2v4h4M9.2 13h5.6M9.2 16.6h5.6', // ic-doc
  coffee: 'M3.8 7.6h12.4v4.2a5 5 0 0 1-5 5h-2.4a5 5 0 0 1-5-5zM16.2 8.6h1.8a2.1 2.1 0 0 1 0 4.8h-1.8M3 20.6h14', // ic-coffee
  shield: 'M12 3.2l7 2.9v6c0 4.6-3 7.7-7 9.1-4-1.4-7-4.5-7-9.1v-6zM9 12.2l2.2 2.2 4-4', // ic-shield
  filter: 'M4 6.6h16M7 12h10M10 17.4h4', // ic-filter
  face: 'M8.6 3.6H3.6v5M15.4 3.6h5v5M8.6 20.4H3.6v-5M15.4 20.4h5v-5M9.4 10h.02M14.6 10h.02M9.6 14.6c1.4 1.2 3.4 1.2 4.8 0', // ic-face
  swap: 'M3.8 8.4h14.4l-3.4-3.4M20.2 15.6H5.8l3.4 3.4', // ic-swap
  lock: 'M5.6 10.4h12.8v9.8H5.6zM8.6 10.4V7.8a3.4 3.4 0 0 1 6.8 0v2.6M12 14v2.6', // ic-lock
  calendar: 'M4 5.8h16v14.4H4zM4 10h16M8.4 3.2v4.4M15.6 3.2v4.4', // ic-cal
  cloud: 'M7.4 18.4h9.8a3.6 3.6 0 0 0 .4-7.2 5.4 5.4 0 0 0-10.4-1.2 3.7 3.7 0 0 0 .2 8.4z', // ic-cloud
  x: 'M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6', // ic-x
};

export function Icon({ name, color, size = 22, strokeWidth = 1.8 }: IconProps) {
  const s = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'clock' ? (
        // ic-clock
        <>
          <Circle {...s} cx="12" cy="12" r="8.6" />
          <Path {...s} d="M12 7.2V12l3.6 2.1" />
        </>
      ) : name === 'pin' ? (
        // ic-pin
        <>
          <Path {...s} d="M12 21.2s7-6.4 7-11.2a7 7 0 1 0-14 0c0 4.8 7 11.2 7 11.2z" />
          <Circle {...s} cx="12" cy="9.8" r="2.6" />
        </>
      ) : name === 'user' ? (
        // ic-user
        <>
          <Circle {...s} cx="12" cy="8" r="3.6" />
          <Path {...s} d="M4.8 20.4c1.4-3.6 4-5.4 7.2-5.4s5.8 1.8 7.2 5.4" />
        </>
      ) : name === 'camera' ? (
        // ic-cam
        <>
          <Path {...s} d="M3.6 8h3.2l1.6-2.2h7.2L17.2 8h3.2v11.4H3.6z" />
          <Circle {...s} cx="12" cy="13.6" r="3.2" />
        </>
      ) : name === 'eye' || name === 'eye-off' ? (
        // ic-eye (+ traço diagonal quando a senha está oculta)
        <>
          <Path {...s} d="M2.6 12S6 6.4 12 6.4 21.4 12 21.4 12 18 17.6 12 17.6 2.6 12 2.6 12z" />
          <Circle {...s} cx="12" cy="12" r="2.8" />
          {name === 'eye-off' ? <Path {...s} d="M4 20 20 4" /> : null}
        </>
      ) : (
        <Path {...s} d={D[name]} />
      )}
    </Svg>
  );
}

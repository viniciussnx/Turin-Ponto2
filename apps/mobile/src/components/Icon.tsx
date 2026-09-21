import Svg, { Circle, Path, Rect } from 'react-native-svg';

/// Ícones do protótipo, redesenhados como traço em SVG.
///
/// Os nomes espelham o sprite do arquivo de design (`#ic-home`, `#ic-clock`…)
/// para que dê para conferir tela contra tela sem tradução mental.
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
  | 'logout';

interface IconProps {
  name: IconName;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export function Icon({ name, color, size = 22, strokeWidth = 1.8 }: IconProps) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {paths(name, common, color)}
    </Svg>
  );
}

function paths(
  name: IconName,
  s: Record<string, unknown>,
  color: string,
): React.ReactNode {
  switch (name) {
    case 'home':
      return <Path {...s} d="M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5M9.5 20v-6h5v6" />;
    case 'clock':
      return (
        <>
          <Circle {...s} cx="12" cy="12" r="8.5" />
          <Path {...s} d="M12 7v5.2l3.4 2" />
        </>
      );
    case 'mirror':
      return (
        <>
          <Rect {...s} x="3.5" y="4.5" width="17" height="15" rx="2.5" />
          <Path {...s} d="M3.5 9.5h17M9 9.5V19.5M14.5 4.5v15" />
        </>
      );
    case 'inbox':
      return (
        <>
          <Path {...s} d="M3.5 13.5 6 5.5h12l2.5 8v5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" />
          <Path {...s} d="M3.5 13.5h4l1.2 2.4h6.6l1.2-2.4h4" />
        </>
      );
    case 'user':
      return (
        <>
          <Circle {...s} cx="12" cy="8.5" r="3.8" />
          <Path {...s} d="M4.8 20c.7-3.6 3.7-5.6 7.2-5.6s6.5 2 7.2 5.6" />
        </>
      );
    case 'pin':
      return (
        <>
          <Path {...s} d="M12 21c4-4.4 6-7.6 6-10.2A6 6 0 0 0 6 10.8C6 13.4 8 16.6 12 21z" />
          <Circle {...s} cx="12" cy="10.6" r="2.3" />
        </>
      );
    case 'face':
      return (
        <>
          <Path {...s} d="M4 8.5V6a2 2 0 0 1 2-2h2.5M15.5 4H18a2 2 0 0 1 2 2v2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5M8.5 20H6a2 2 0 0 1-2-2v-2.5" />
          <Path {...s} d="M9.3 10.5v1.2M14.7 10.5v1.2M9.4 15c1.5 1.2 3.7 1.2 5.2 0" />
        </>
      );
    case 'check':
      return <Path {...s} d="m5 12.5 4.5 4.5L19 7.5" />;
    case 'swap':
      return <Path {...s} d="M4 8.5h13M13.5 5l3.5 3.5-3.5 3.5M20 15.5H7M10.5 12 7 15.5l3.5 3.5" />;
    case 'doc':
      return (
        <>
          <Path {...s} d="M6.5 3.5h7l4.5 4.5v12a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 20V5a1.5 1.5 0 0 1 1.5-1.5z" />
          <Path {...s} d="M13.5 3.5V8H18M8.5 12.5h7M8.5 16h5" />
        </>
      );
    case 'alert':
      return (
        <>
          <Path {...s} d="M12 4.2 21 19.5H3z" />
          <Path {...s} d="M12 10v4" />
          <Circle cx="12" cy="16.8" r="1" fill={color} />
        </>
      );
    case 'bell':
      return (
        <>
          <Path {...s} d="M6.5 17V10.5a5.5 5.5 0 0 1 11 0V17l1.5 2.2h-14z" />
          <Path {...s} d="M10.2 19.2a2 2 0 0 0 3.6 0" />
        </>
      );
    case 'moon':
      return <Path {...s} d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z" />;
    case 'shield':
      return (
        <>
          <Path {...s} d="M12 3.4 19 6v6c0 4-3 7.2-7 8.6-4-1.4-7-4.6-7-8.6V6z" />
          <Path {...s} d="m9.2 12 2 2 3.6-3.8" />
        </>
      );
    case 'coffee':
      return (
        <>
          <Path {...s} d="M4.5 9h12v6.5a3.5 3.5 0 0 1-3.5 3.5H8a3.5 3.5 0 0 1-3.5-3.5z" />
          <Path {...s} d="M16.5 10.5H18a2.5 2.5 0 0 1 0 5h-1.5M7.5 3.5v2.2M11 3.5v2.2M14.5 3.5v2.2" />
        </>
      );
    case 'bus':
      return (
        <>
          <Rect {...s} x="4" y="4" width="16" height="12.5" rx="2.5" />
          <Path {...s} d="M4 10.5h16M8 16.5v2M16 16.5v2" />
          <Circle cx="8.2" cy="13.5" r="1.1" fill={color} />
          <Circle cx="15.8" cy="13.5" r="1.1" fill={color} />
        </>
      );
    case 'chevron-down':
      return <Path {...s} d="m7 10 5 5 5-5" />;
    case 'chevron-up':
      return <Path {...s} d="m7 14 5-5 5 5" />;
    case 'chevron-right':
      return <Path {...s} d="m10 7 5 5-5 5" />;
    case 'chevron-left':
      return <Path {...s} d="m14 7-5 5 5 5" />;
    case 'plus':
      return <Path {...s} d="M12 5.5v13M5.5 12h13" />;
    case 'camera':
      return (
        <>
          <Path {...s} d="M4 8.5h3.5L9 6h6l1.5 2.5H20v10a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z" />
          <Circle {...s} cx="12" cy="13.2" r="3.4" />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect {...s} x="5" y="10.5" width="14" height="9.5" rx="2" />
          <Path {...s} d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7" />
        </>
      );
    case 'logout':
      return <Path {...s} d="M14 7.5V5.5A1.5 1.5 0 0 0 12.5 4h-6A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20h6a1.5 1.5 0 0 0 1.5-1.5v-2M10 12h9.5M16.5 8.8 20 12l-3.5 3.2" />;
    default:
      return null;
  }
}

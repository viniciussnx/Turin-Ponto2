/// Ícones em traço, no mesmo desenho dos do app.
export type IconName =
  | "pulse"
  | "clock"
  | "swap"
  | "mirror"
  | "users"
  | "calendar"
  | "pin"
  | "star"
  | "sync"
  | "shield"
  | "logout"
  | "menu"
  | "search"
  | "check"
  | "x"
  | "alert"
  | "chevron-left"
  | "chevron-right"
  | "download"
  | "filter"
  | "plus"
  | "key";

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {path(name)}
    </svg>
  );
}

function path(name: IconName) {
  switch (name) {
    case "pulse":
      return <path d="M3 12h4l2.5-7 4.5 14 2.5-7h4.5" />;
    case "clock":
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5.2l3.4 2" />
        </>
      );
    case "swap":
      return <path d="M4 8.5h13M13.5 5l3.5 3.5-3.5 3.5M20 15.5H7M10.5 12 7 15.5l3.5 3.5" />;
    case "mirror":
      return (
        <>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
          <path d="M3.5 9.5h17M9 9.5v10M14.5 4.5v15" />
        </>
      );
    case "users":
      return (
        <>
          <circle cx="9.5" cy="8.5" r="3.4" />
          <path d="M3.2 19.5c.6-3.2 3.2-5 6.3-5s5.7 1.8 6.3 5M16 5.4a3.4 3.4 0 0 1 0 6.5M17.6 14.9c2 .6 3.4 2.2 3.8 4.6" />
        </>
      );
    case "calendar":
      return (
        <>
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M3.5 10h17M8 3.2V6.4M16 3.2V6.4" />
        </>
      );
    case "pin":
      return (
        <>
          <path d="M12 21c4-4.4 6-7.6 6-10.2A6 6 0 0 0 6 10.8C6 13.4 8 16.6 12 21z" />
          <circle cx="12" cy="10.6" r="2.3" />
        </>
      );
    case "star":
      return <path d="m12 4 2.5 5.2 5.5.8-4 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4-3.9 5.5-.8z" />;
    case "sync":
      return <path d="M20 12a8 8 0 0 1-13.7 5.6M4 12a8 8 0 0 1 13.7-5.6M4 18.5V13h5.5M20 5.5V11h-5.5" />;
    case "shield":
      return (
        <>
          <path d="M12 3.4 19 6v6c0 4-3 7.2-7 8.6-4-1.4-7-4.6-7-8.6V6z" />
          <path d="m9.2 12 2 2 3.6-3.8" />
        </>
      );
    case "logout":
      return <path d="M14 7.5V5.5A1.5 1.5 0 0 0 12.5 4h-6A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20h6a1.5 1.5 0 0 0 1.5-1.5v-2M10 12h9.5M16.5 8.8 20 12l-3.5 3.2" />;
    case "menu":
      return <path d="M4 7h16M4 12h16M4 17h16" />;
    case "search":
      return (
        <>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </>
      );
    case "check":
      return <path d="m5 12.5 4.5 4.5L19 7.5" />;
    case "x":
      return <path d="M6 6l12 12M18 6L6 18" />;
    case "alert":
      return (
        <>
          <path d="M12 4.2 21 19.5H3z" />
          <path d="M12 10v4" />
          <circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none" />
        </>
      );
    case "chevron-left":
      return <path d="m14 7-5 5 5 5" />;
    case "chevron-right":
      return <path d="m10 7 5 5-5 5" />;
    case "download":
      return <path d="M12 4v11M8 11.5l4 4 4-4M4.5 19.5h15" />;
    case "filter":
      return <path d="M4 6h16l-6.2 7.2v5.4l-3.6 1.9v-7.3z" />;
    case "plus":
      return <path d="M12 5.5v13M5.5 12h13" />;
    case "key":
      return (
        <>
          <circle cx="8" cy="12" r="3.8" />
          <path d="M11.8 12H20M17 12v3.2M20 12v2.4" />
        </>
      );
    default:
      return null;
  }
}

/// Marca da Turin em traço.
///
/// Herda `currentColor`, então serve no rail escuro e sobre fundo claro sem
/// precisar de dois arquivos. A régua à esquerda é o traço que atravessa o
/// logotipo original.
export function TurinMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 158 34"
      fill="none"
      className={className}
      role="img"
      aria-label="Turin"
    >
      <path d="M1 17h40" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <text
        x="48"
        y="26"
        fill="currentColor"
        style={{
          font: "700 28px var(--font-barlow-condensed), sans-serif",
          letterSpacing: "0.15em",
        }}
      >
        TURIN
      </text>
    </svg>
  );
}

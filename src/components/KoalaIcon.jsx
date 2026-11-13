/* o coala da marca, sem rosto: duas orelhas e a cabeça, no laranja do tema */
export default function KoalaIcon({ size = 24, className = 'koala-icon' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="15" fill="var(--orange)" />
      <circle cx="80" cy="20" r="15" fill="var(--orange)" />
      <circle cx="50" cy="56" r="36" fill="var(--orange)" />
    </svg>
  );
}

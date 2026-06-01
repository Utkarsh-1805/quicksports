/**
 * Material Symbols Outlined glyph wrapper.
 * Usage: <Icon name="search" /> or <Icon name="bookmark" filled className="text-secondary" />
 */
export function Icon({ name, filled = false, className = '', size, ...props }) {
  const sizeStyle = size ? { fontSize: `${size}px` } : undefined;
  return (
    <span
      className={`material-symbols-outlined ${filled ? 'fill' : ''} ${className}`.trim()}
      style={sizeStyle}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  );
}

export default Icon;

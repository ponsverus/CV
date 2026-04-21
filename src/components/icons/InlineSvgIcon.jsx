import React, { useMemo } from 'react';

function normalizeColorAttr(match, quote, value) {
  if (String(value).trim().toLowerCase() === 'none') return match;
  return `${match.slice(0, match.indexOf('=') + 2)}currentColor${quote}`;
}

function normalizeSvg(svg) {
  const cleaned = String(svg || '')
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .trim();

  const viewBoxMatch = cleaned.match(/viewBox=(["'])(.*?)\1/i);
  const widthMatch = cleaned.match(/width=(["'])(.*?)\1/i);
  const heightMatch = cleaned.match(/height=(["'])(.*?)\1/i);

  const viewBox = viewBoxMatch?.[2]
    || `0 0 ${widthMatch?.[2] || 24} ${heightMatch?.[2] || 24}`;

  const inner = cleaned
    .replace(/<svg[\s\S]*?>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .replace(/\sfill=(["'])(.*?)\1/gi, normalizeColorAttr)
    .replace(/\sstroke=(["'])(.*?)\1/gi, normalizeColorAttr);

  return { inner, viewBox };
}

export default function InlineSvgIcon({
  svg,
  className = '',
  title,
  ...props
}) {
  const normalized = useMemo(() => normalizeSvg(svg), [svg]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={normalized.viewBox}
      className={className}
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : 'presentation'}
      focusable="false"
      dangerouslySetInnerHTML={{
        __html: title ? `<title>${title}</title>${normalized.inner}` : normalized.inner,
      }}
      {...props}
    />
  );
}

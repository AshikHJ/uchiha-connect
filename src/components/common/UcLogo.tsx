import React from 'react';
import { BRAND } from '../../config/brand';

interface UcLogoProps {
  size?: number;
  className?: string;
  variant?: 'crimson' | 'charcoal' | 'white' | 'minimal';
  showText?: boolean;
  showTagline?: boolean;
  textColor?: string;
}

export const UcMonogram: React.FC<{ size?: number; className?: string; variant?: 'crimson' | 'charcoal' | 'white' | 'minimal' }> = ({
  size = 36,
  className = '',
  variant = 'crimson',
}) => {
  const bgFill =
    variant === 'crimson'
      ? BRAND.colors.crimson
      : variant === 'charcoal'
      ? BRAND.colors.charcoal
      : variant === 'white'
      ? '#FFFFFF'
      : 'transparent';

  const strokeColor =
    variant === 'white'
      ? BRAND.colors.crimson
      : '#FFFFFF';

  const accentColor =
    variant === 'crimson'
      ? '#FFFFFF'
      : variant === 'charcoal'
      ? BRAND.colors.crimson
      : BRAND.colors.charcoal;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="UCHIHA CONNECT (UC) Monogram Logo"
    >
      {/* Background Rounded Squircle */}
      {variant !== 'minimal' && (
        <rect
          width="100"
          height="100"
          rx="26"
          fill={bgFill}
        />
      )}

      {/* Minimalist Geometric UC Monogram */}
      {/* 'U' Stroke: Outer geometric arc */}
      <path
        d="M28 26 V54 C28 66 38 74 50 74 C62 74 72 66 72 54"
        stroke={strokeColor}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 'C' Stroke: Nested concentric arc wrapping within the U curve */}
      <path
        d="M66 36 C60 28 48 27 40 33 C32 39 31 52 38 60 C44 67 56 67 64 61"
        stroke={accentColor}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Modern Center Focal Identity Dot */}
      <circle cx="50" cy="48" r="4.5" fill={accentColor} />
    </svg>
  );
};

export const UcLogo: React.FC<UcLogoProps> = ({
  size = 36,
  className = '',
  variant = 'crimson',
  showText = true,
  showTagline = false,
  textColor,
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <UcMonogram size={size} variant={variant} />
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span
              className="font-serif font-black tracking-tight text-lg leading-none"
              style={{ color: textColor || BRAND.colors.charcoal }}
            >
              UCHIHA CONNECT
            </span>
            <span
              className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded font-mono"
              style={{
                backgroundColor: BRAND.colors.crimsonLight,
                color: BRAND.colors.crimson,
              }}
            >
              UC
            </span>
          </div>
          {showTagline && (
            <span
              className="text-[10px] font-medium tracking-wide mt-0.5 leading-none"
              style={{ color: BRAND.colors.mutedGrey }}
            >
              {BRAND.tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

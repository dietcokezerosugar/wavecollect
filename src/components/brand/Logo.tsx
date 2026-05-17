import React from 'react';

interface LogoProps {
  className?: string;
  height?: number | string;
  variant?: 'full' | 'icon';
  textColor?: string;
}

export function Logo({ className = '', height = 32, variant = 'full', textColor }: LogoProps) {
  if (variant === 'icon') {
    return (
      <svg
        width="128"
        height="128"
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ height: height, width: 'auto', display: 'inline-block', verticalAlign: 'middle' }}
      >
        <defs>
          <linearGradient id="payxmintBlueIcon" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2F9BFF"/>
            <stop offset="1" stopColor="#0072FF"/>
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r="58" fill="url(#payxmintBlueIcon)"/>
        <path
          d="M46 26H72C89 26 100 37 100 53C100 70 88 81 70 81H58V104H46V26ZM70 70C81 70 88 64 88 53C88 42 81 37 70 37H58V70H70Z"
          fill="white"
        />
      </svg>
    );
  }

  // Set default text fill to #002C8A if not overridden
  const textFill = textColor || '#002C8A';

  return (
    <svg
      width="620"
      height="140"
      viewBox="0 0 620 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ height: height, width: 'auto', display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        <linearGradient id="payxmintBlueFull" x1="0" y1="0" x2="140" y2="140" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2F9BFF"/>
          <stop offset="1" stopColor="#0072FF"/>
        </linearGradient>
      </defs>

      {/* ICON */}
      <circle cx="70" cy="70" r="58" fill="url(#payxmintBlueFull)"/>

      {/* P LETTER */}
      <path
        d="M50 32H77C95 32 107 43 107 60C107 78 94 89 75 89H62V112H50V32ZM75 77C86 77 94 71 94 60C94 49 86 44 75 44H62V77H75Z"
        fill="white"
      />

      {/* TEXT */}
      <text
        x="150"
        y="92"
        fontFamily="'Poppins', 'Montserrat', sans-serif"
        fontSize="74"
        fontStyle="italic"
        fontWeight="800"
        letterSpacing="-3"
        fill={textFill}
      >
        PayxMint
      </text>
    </svg>
  );
}

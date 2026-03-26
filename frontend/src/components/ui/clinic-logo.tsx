"use client";

import React from "react";

const SPECIALTY_ICONS: Record<string, (size: number) => React.ReactNode> = {
  odontologia: (s) => (
    <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 6C24 6 20 10 18 14c-2 4-1 10 1 16 2 6 4 14 5 20 .5 3 2 4 4 4s3-1 4-5l2-10c.5-2 1.5-3 3-3s2.5 1 3 3l2 10c1 4 2 5 4 5s3.5-1 4-4c1-6 3-14 5-20 2-6 3-12 1-16C53 10 40 6 32 6z" fill="#06B6D4" stroke="#0891B2" strokeWidth="2"/>
    </svg>
  ),
  kinesiologia: (s) => (
    <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="12" r="6" fill="#10B981" stroke="#059669" strokeWidth="2"/>
      <path d="M24 24c0-4 4-8 8-8s8 4 8 8v4l6 12h-6l-2 16h-12l-2-16h-6l6-12v-4z" fill="#10B981" stroke="#059669" strokeWidth="2"/>
      <path d="M18 32c-2 0-4-2-3-4l2-4" stroke="#059669" strokeWidth="2" strokeLinecap="round"/>
      <path d="M46 32c2 0 4-2 3-4l-2-4" stroke="#059669" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  nutricion: (s) => (
    <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 16c0-6 4-10 8-10 2 0 4 2 4 6v12h-4C22 24 20 20 20 16z" fill="#F97316" stroke="#EA580C" strokeWidth="2"/>
      <path d="M32 24v30" stroke="#EA580C" strokeWidth="3" strokeLinecap="round"/>
      <ellipse cx="32" cy="56" rx="14" ry="4" fill="#FDBA74" stroke="#EA580C" strokeWidth="2"/>
      <circle cx="38" cy="14" r="4" fill="#FB923C" stroke="#EA580C" strokeWidth="1.5"/>
      <circle cx="44" cy="20" r="3" fill="#FB923C" stroke="#EA580C" strokeWidth="1.5"/>
    </svg>
  ),
  medicina_general: (s) => (
    <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="18" width="28" height="28" rx="6" fill="#3B82F6" stroke="#2563EB" strokeWidth="2"/>
      <rect x="29" y="24" width="6" height="16" rx="2" fill="white"/>
      <rect x="24" y="29" width="16" height="6" rx="2" fill="white"/>
    </svg>
  ),
  psicologia: (s) => (
    <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8C20 8 12 18 12 28c0 6 3 12 8 16v12h24V44c5-4 8-10 8-16C52 18 44 8 32 8z" fill="#A855F7" stroke="#9333EA" strokeWidth="2"/>
      <path d="M26 44c0-4 2.5-6 6-6s6 2 6 6" stroke="#9333EA" strokeWidth="2" fill="none"/>
    </svg>
  ),
  general: (s) => (
    <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 56l-20-22C6 26 8 16 16 12c6-3 12 0 16 6 4-6 10-9 16-6 8 4 10 14 4 22L32 56z" fill="#F43F5E" stroke="#E11D48" strokeWidth="2"/>
      <rect x="29" y="24" width="6" height="14" rx="2" fill="white"/>
      <rect x="25" y="28" width="14" height="6" rx="2" fill="white"/>
    </svg>
  ),
};

interface ClinicLogoProps {
  logoUrl: string | null;
  especialidad: string | null;
  size?: number;
  className?: string;
}

export function ClinicLogo({ logoUrl, especialidad, size = 36, className = "" }: ClinicLogoProps) {
  // Custom logo uploaded by the user
  if (logoUrl && !logoUrl.startsWith("__esp:")) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={logoUrl}
        alt="Logo"
        width={size}
        height={size}
        className={`rounded-lg object-contain ${className}`}
      />
    );
  }

  // Specialty-based default icon
  const esp = logoUrl?.startsWith("__esp:") ? logoUrl.replace("__esp:", "") : (especialidad || "general");
  const renderIcon = SPECIALTY_ICONS[esp] || SPECIALTY_ICONS.general;

  return (
    <div
      className={`flex items-center justify-center rounded-lg ${className}`}
      style={{ width: size, height: size }}
    >
      {renderIcon(size)}
    </div>
  );
}

export { SPECIALTY_ICONS };

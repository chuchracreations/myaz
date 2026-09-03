import React from 'react';

interface OctopusIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const OctopusIcon: React.FC<OctopusIconProps> = ({ size = 20, className, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Mantle / Head */}
      <path d="M12 2C6.5 2 4 6.5 4 11.5c0 2.5 1 4.5 2.5 5.5" />
      <path d="M12 2c5.5 0 8 4.5 8 9.5 0 2.5-1 4.5-2.5 5.5" />

      {/* Eyes */}
      <circle cx="9" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10.5" r="1.5" fill="currentColor" stroke="none" />

      {/* Tentacles */}
      <path d="M6.5 17c-.8 1.3-1.4 2.8-.7 4 .6 1 1.9.9 2.6 0 .8-1.2.9-2.6 1.1-4" />
      <path d="M9.5 17c-.3 1.4-.2 2.9.5 3.9.7 1 2.1.8 2.6-.3.5-1.1.2-2.3 0-3.6" />
      <path d="M14 17c-.2 1.3-.5 2.5 0 3.6.5 1.1 1.9 1.3 2.6.3.7-1 .8-2.5.5-3.9" />
      <path d="M14.5 17c.2 1.4.3 2.8 1.1 4 .7.9 2 1 2.6 0 .7-1.2.1-2.7-.7-4" />
    </svg>
  );
};

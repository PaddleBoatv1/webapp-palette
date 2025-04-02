
import React from 'react';

interface GoogleIconProps {
  className?: string;
}

const GoogleIcon: React.FC<GoogleIconProps> = ({ className }) => {
  return (
    <svg 
      className={className} 
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M15.545 6.558a9.42 9.42 0 0 0-.139-1.626h-7.32v3.084h4.18a3.6 3.6 0 0 1-1.547 2.329v1.933h2.509c1.465-1.35 2.317-3.335 2.317-5.72Z" fill="#4285F4"/>
      <path d="M8.086 15.999c2.097 0 3.854-.69 5.14-1.887l-2.509-1.933a4.757 4.757 0 0 1-7.106-2.492H1.04v1.997a8 8 0 0 0 7.046 6.315Z" fill="#34A853"/>
      <path d="M3.611 9.687a4.72 4.72 0 0 1 0-3.027V4.663H1.04a7.994 7.994 0 0 0 0 7.174l2.571-2.15Z" fill="#FBBC05"/>
      <path d="M8.086 3.458a4.385 4.385 0 0 1 3.082 1.195l2.224-2.175A7.76 7.76 0 0 0 8.086 0a8 8 0 0 0-7.046 6.315l2.571 2.15a4.77 4.77 0 0 1 4.475-5.008Z" fill="#EA4335"/>
    </svg>
  );
};

export default GoogleIcon;

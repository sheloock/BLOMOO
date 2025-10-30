'use client';

import { ButtonProps } from '@/types';

export default function Button({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary', 
  size,
  disabled = false,
  type = 'button'
}: ButtonProps) {
  const sizeClass = size ? `btn-${size}` : '';
  const variantClass = `btn-${variant}`;
  
  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
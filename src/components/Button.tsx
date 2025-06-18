import React from 'react';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  className = '', 
  disabled = false,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium focus:outline-none transition duration-150 ease-in-out";
  
  const variantStyles = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white shadow-sm",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
  };
  
  const sizeStyles = {
    small: "px-2.5 py-1.5 text-xs",
    medium: "px-4 py-2 text-sm",
    large: "px-6 py-3 text-base"
  };
  
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90";
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

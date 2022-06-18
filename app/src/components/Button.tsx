import React, { FC } from 'react';

type ButtonProps = {
  children: React.ReactNode;
  color?: string | null;
  fullwidth?: boolean;
  onClick: () => void;
};
const Button: FC<ButtonProps> = ({ children, color, fullwidth, onClick }) => {
  const colorStyle = color
    ? `border-transparent bg-${color}-600 text-white hover:bg-${color}-700 focus:ring-${color}-500`
    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500';
  const widthStyle = fullwidth ? 'w-full' : '';

  return (
    <button
      type="button"
      className={`inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 md:ml-3 md:w-auto md:text-sm ${colorStyle} ${widthStyle}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

Button.defaultProps = {
  color: null,
  fullwidth: false,
};

export default Button;

import React from 'react';

interface BadgeProps {
  text: string;
}

const Badge: React.FC<BadgeProps> = ({ text }) => {
  const bgColor = text === 'ESG' ? 'bg-emerald-500' : 'bg-indigo-500';
  
  return (
    <span className={`${bgColor} text-white text-xs font-medium px-3 py-1 rounded-md`}>
      {text}
    </span>
  );
};

export default Badge; 
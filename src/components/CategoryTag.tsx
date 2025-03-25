import React from 'react';

interface CategoryTagProps {
  text: string;
}

const CategoryTag: React.FC<CategoryTagProps> = ({ text }) => {
  return (
    <span className="text-gray-700 text-xs font-medium tracking-wide uppercase border border-gray-300 px-4 py-1.5 rounded-md hover:bg-gray-50 transition-colors">
      {text}
    </span>
  );
};

export default CategoryTag; 
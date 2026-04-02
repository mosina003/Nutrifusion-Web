import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onClear,
  placeholder = 'Search by symptom, point name, or meridian...',
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim().length > 0) {
      onSearch(value);
    } else {
      onClear();
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onClear();
  };

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
        <Input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 pr-10 h-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

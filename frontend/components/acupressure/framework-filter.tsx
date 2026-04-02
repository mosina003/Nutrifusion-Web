import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';

interface FrameworkFilterProps {
  onFilterChange: (framework: string | null) => void;
  selectedFramework: string | null;
}

const frameworks = [
  { value: 'all', label: 'All Frameworks' },
  { value: 'Ayurveda', label: '🍃 Ayurveda' },
  { value: 'Unani', label: '⚖️ Unani' },
  { value: 'TCM', label: '🐉 Traditional Chinese Medicine' },
  { value: 'Modern', label: '🔬 Modern Medicine' },
];

export const FrameworkFilter: React.FC<FrameworkFilterProps> = ({
  onFilterChange,
  selectedFramework,
}) => {
  const handleChange = (value: string) => {
    if (value === 'all') {
      onFilterChange(null);
    } else {
      onFilterChange(value);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
      <Select value={selectedFramework || 'all'} onValueChange={handleChange}>
        <SelectTrigger className="w-full h-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
          <SelectValue placeholder="Select framework..." />
        </SelectTrigger>
        <SelectContent>
          {frameworks.map((framework) => (
            <SelectItem key={framework.value} value={framework.value}>
              {framework.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

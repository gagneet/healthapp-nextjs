import { PencilIcon } from '@heroicons/react/24/outline';

interface QualificationProps {
  degree: string;
  institution: string;
  year: string;
  onEdit: () => void;
  type: 'degree' | 'specialization' | 'continuing_education';
}

export const QualificationCard = ({ degree, institution, year, onEdit, type }: QualificationProps) => {
  const colorClasses = {
    degree: 'border-blue-500 bg-blue-50',
    specialization: 'border-green-500 bg-green-50',
    continuing_education: 'border-purple-500 bg-purple-50',
  };

  const buttonColorClasses = {
    degree: 'text-blue-600 hover:text-blue-700',
    specialization: 'text-green-600 hover:text-green-700',
    continuing_education: 'text-purple-600 hover:text-purple-700',
  }

  return (
    <div className={`border-l-4 ${colorClasses[type]} p-4 rounded-r-lg`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{degree}</h4>
          <p className="text-sm text-gray-600">{institution}</p>
          <p className="text-xs text-gray-500">{year}</p>
        </div>
        <button onClick={onEdit} className={`${buttonColorClasses[type]} p-1`}>
          <PencilIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

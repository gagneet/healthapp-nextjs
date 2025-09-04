interface QualificationProps {
  degree: string;
  institution: string;
  year: string;
  type: 'degree' | 'specialization' | 'continuing_education';
}

export const QualificationCard = ({ degree, institution, year, type }: QualificationProps) => {
  const colorClasses = {
    degree: 'border-blue-500 bg-blue-50',
    specialization: 'border-green-500 bg-green-50',
    continuing_education: 'border-purple-500 bg-purple-50',
  };

  return (
    <div className={`border-l-4 ${colorClasses[type]} p-4 rounded-r-lg`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{degree}</h4>
          <p className="text-sm text-gray-600">{institution}</p>
          <p className="text-xs text-gray-500">{year}</p>
        </div>
      </div>
    </div>
  );
};

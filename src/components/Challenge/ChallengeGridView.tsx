import React from 'react';

interface ChallengeGridViewProps {
  children: React.ReactNode;
}

const ChallengeGridView: React.FC<ChallengeGridViewProps> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {children}
    </div>
  );
};

export default ChallengeGridView;

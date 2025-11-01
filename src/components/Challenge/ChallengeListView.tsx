import React from 'react';

interface ChallengeListViewProps {
  children: React.ReactNode;
}

const ChallengeListView: React.FC<ChallengeListViewProps> = ({ children }) => {
  return (
    <div className="flex flex-col gap-4">
      {children}
    </div>
  );
};

export default ChallengeListView;

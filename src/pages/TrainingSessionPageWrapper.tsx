import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TrainingSessionPage } from '@/components/TrainingSessionPage';

const TrainingSessionPageWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, type, challengeId, dayId, exercises, title } = location.state || {};

  const handleClose = () => {
    if (type === 'challenge-day') {
      navigate(`/challenge/${challengeId}/day/${dayId}`);
    } else {
      navigate('/training');
    }
  };

  // If no session data, create a mock session from the passed data
  const trainingSession = session || {
    id: 1,
    title: title || 'Training Session',
    type: type || 'training',
    exercises: exercises || [],
    challengeId,
    dayId
  };

  return (
    <TrainingSessionPage
      session={trainingSession}
      onClose={handleClose}
    />
  );
};

export default TrainingSessionPageWrapper;
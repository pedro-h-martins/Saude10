import { FeedbackSurveyModal } from '@/components/FeedbackSurveyModal';
import { useFeedbackSurvey } from '@/hooks/useFeedbackSurvey';
import React from 'react';

export default function FeedbackSurveyPrompt() {
  const { visible, setVisible, submitSurvey } = useFeedbackSurvey();

  return (
    <FeedbackSurveyModal
      visible={visible}
      onClose={() => setVisible(false)}
      onSubmit={submitSurvey}
    />
  );
}

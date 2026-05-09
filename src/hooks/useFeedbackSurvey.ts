import { useQuery } from '@/context/RealmProvider';
import { useSync } from '@/hooks/useSync';
import { FeedbackSurvey } from '@/models/FeedbackSurvey';
import { Realm } from '@realm/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const SURVEY_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

type SurveyPayload = {
  rating: number;
  feedback: string;
  type: 'bug' | 'suggestion';
  context?: string;
};

export function useFeedbackSurvey() {
  const surveys = useQuery(FeedbackSurvey).sorted('createdAt', true);
  const { save } = useSync();
  const [visible, setVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const lastSurvey = surveys.length > 0 ? surveys[0] : null;

  const shouldPrompt = useMemo(() => {
    if (!lastSurvey) return true;
    return Date.now() - lastSurvey.createdAt.getTime() >= SURVEY_INTERVAL_MS;
  }, [lastSurvey]);

  useEffect(() => {
    if (!hasTriggered && shouldPrompt) {
      setVisible(true);
      setHasTriggered(true);
    }
  }, [hasTriggered, shouldPrompt]);

  const submitSurvey = useCallback(
    async (payload: SurveyPayload) => {
      const newId = new Realm.BSON.ObjectId();
      await save('FeedbackSurvey', newId.toHexString(), {
        _id: newId,
        rating: payload.rating,
        feedback: payload.feedback,
        type: payload.type,
        context: payload.context ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setVisible(false);
    },
    [save]
  );

  return {
    visible,
    setVisible,
    submitSurvey,
    lastSurvey,
    surveyCount: surveys.length,
  };
}

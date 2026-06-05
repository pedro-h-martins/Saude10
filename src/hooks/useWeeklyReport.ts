import { useAuth } from '@/context/AuthContext';
import { useRealm } from '@/context/RealmProvider';
import { getWeeklySummary, sendWeeklyReport, type WeeklySummary } from '@/services/weeklyReport';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export function useWeeklyReport() {
  const realm = useRealm();
  const { currentUser } = useAuth();

  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const refresh = useCallback(() => {
    if (!currentUser || realm.isClosed) {
      setSummary(null);
      setIsLoading(false);
      return;
    }

    try {
      const result = getWeeklySummary(realm, currentUser._id);
      setSummary(result);
    } catch (error) {
      console.warn('[useWeeklyReport] Failed to compute summary', error);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [realm, currentUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sendEmail = useCallback(async () => {
    if (!summary) return;
    if (!currentUser?.email) {
      Alert.alert('E-mail ausente', 'Cadastre um e-mail no seu perfil para receber o relatório.');
      return;
    }

    setIsSending(true);
    try {
      const { sent, method } = await sendWeeklyReport(
        summary,
        currentUser.name || 'Usuário',
        currentUser.email,
      );

      if (method === 'mail' && !sent) {
        Alert.alert('Cancelado', 'O envio do e-mail foi cancelado.');
      }
    } catch (error) {
      console.error('[useWeeklyReport] sendEmail error', error);
      Alert.alert('Erro', 'Não foi possível enviar o relatório. Tente novamente.');
    } finally {
      setIsSending(false);
    }
  }, [summary, currentUser]);

  return { summary, isLoading, isSending, refresh, sendEmail };
}

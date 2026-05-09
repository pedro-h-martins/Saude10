import { useQuery, useRealm } from '@/context/RealmProvider';
import { useSync } from '@/hooks/useSync';
import { Reminder } from '@/models/Reminder';
import { Realm } from '@realm/react';

export function useReminders() {
  const realm = useRealm();
  const reminders = useQuery(Reminder);
  const { save, remove } = useSync();

  const addReminder = (title: string, time: string, type: Reminder['type'] = 'custom') => {
    const newId = new Realm.BSON.ObjectId();
    save('Reminder', newId.toHexString(), {
      _id: newId,
      title,
      time,
      type,
      isEnabled: true,
      createdAt: new Date(),
    });
  };

  const toggleReminder = (id: Realm.BSON.ObjectId) => {
    const reminder = realm.objectForPrimaryKey(Reminder, id);
    if (reminder) {
      save('Reminder', id.toHexString(), { isEnabled: !reminder.isEnabled });
    }
  };

  const deleteReminderFn = (id: Realm.BSON.ObjectId) => {
    remove('Reminder', id.toHexString());
  };

  return {
    reminders,
    addReminder,
    toggleReminder,
    deleteReminder: deleteReminderFn,
  };
}

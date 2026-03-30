import { useQuery, useRealm } from '@/context/RealmProvider';
import { Reminder } from '@/models/Reminder';
import { Realm } from '@realm/react';

export function useReminders() {
  const realm = useRealm();
  const reminders = useQuery(Reminder);

  const addReminder = (title: string, time: string, type: Reminder['type'] = 'custom') => {
    realm.write(() => {
      realm.create(Reminder, {
        _id: new Realm.BSON.ObjectId(),
        title,
        time,
        type,
        isEnabled: true,
        createdAt: new Date(),
      });
    });
  };

  const toggleReminder = (id: Realm.BSON.ObjectId) => {
    const reminder = realm.objectForPrimaryKey(Reminder, id);
    if (reminder) {
      realm.write(() => {
        reminder.isEnabled = !reminder.isEnabled;
      });
    }
  };

  const deleteReminder = (id: Realm.BSON.ObjectId) => {
    const reminder = realm.objectForPrimaryKey(Reminder, id);
    if (reminder) {
      realm.write(() => {
        realm.delete(reminder);
      });
    }
  };

  return {
    reminders,
    addReminder,
    toggleReminder,
    deleteReminder,
  };
}

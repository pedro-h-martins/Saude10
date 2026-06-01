import { Colors } from '@/constants/Colors';
import { useQuery, useRealm } from '@/context/RealmProvider';
import { GuidedAudio } from '@/models/GuidedAudio';
import { deleteCachedAudio, downloadAndCacheAudio, getLocalAudioUri } from '@/services/audioMedia';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const AudioLibrary: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const audios = useQuery(GuidedAudio);
  const realm = useRealm();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      (async () => {
        if (soundRef.current) {
          try { await soundRef.current.unloadAsync(); } catch { }
        }
      })();
    };
  }, []);

  const handlePlay = async (item: GuidedAudio) => {
    try {
      setLoadingId(item._id.toHexString());
      const id = item._id.toHexString();
      const localFromField = item.localUri as string | undefined | null;
      const localCached = await getLocalAudioUri(id);
      const sourceUri = localFromField ?? localCached ?? item.remoteUrl ?? null;
      if (!sourceUri) throw new Error('No audio source');
      const source = { uri: sourceUri };

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(item._id.toHexString());
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (e) {
      console.warn('Playback error', e);
    } finally {
      setLoadingId(null);
    }
  };

  const handlePause = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setPlayingId(null);
    }
  };

  const handleDownload = async (item: GuidedAudio) => {
    try {
      setLoadingId(item._id.toHexString());
      if (!item.remoteUrl) throw new Error('No remoteUrl');
      const res = await downloadAndCacheAudio(item.remoteUrl, item._id.toHexString());
      realm.write(() => {
        const obj = realm.objectForPrimaryKey(GuidedAudio, item._id);
        if (obj) obj.localUri = res.localUri;
        if (obj) obj.status = 'downloaded';
      });
    } catch (e) {
      console.warn('Download failed', e);
      realm.write(() => {
        const obj = realm.objectForPrimaryKey(GuidedAudio, item._id);
        if (obj) obj.status = 'failed';
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (item: GuidedAudio) => {
    try {
      setLoadingId(item._id.toHexString());
      await deleteCachedAudio(item._id.toHexString());
      realm.write(() => {
        const obj = realm.objectForPrimaryKey(GuidedAudio, item._id);
        if (obj) {
          obj.localUri = undefined as any;
          obj.status = 'available';
        }
      });
    } catch (e) {
      console.warn('Delete failed', e);
    } finally {
      setLoadingId(null);
    }
  };

  const renderItem = ({ item }: { item: GuidedAudio }) => {
    const id = item._id.toHexString();
    return (
      <View style={styles.item} key={id}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
        </View>

        <View style={styles.actions}>
          {playingId === id ? (
            <TouchableOpacity onPress={handlePause} style={styles.actionBtn}>
              <Ionicons name="pause" size={20} color={Colors.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => handlePlay(item)} style={styles.actionBtn}>
              {loadingId === id ? <ActivityIndicator /> : <Ionicons name="play" size={20} color={Colors.primary} />}
            </TouchableOpacity>
          )}

          {item.localUri ? (
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
              <Ionicons name="trash" size={20} color={Colors.warning} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => handleDownload(item)} style={styles.actionBtn}>
              <Ionicons name="download" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const grouped = React.useMemo(() => {
    const list = Array.from(audios) as GuidedAudio[];
    const groups: Record<string, GuidedAudio[]> = { wind: [], waves: [], forest: [] };
    list.forEach((a) => {
      const c = (a.category as string) || 'wind';
      if (!groups[c]) groups[c] = [];
      groups[c].push(a);
    });
    const sections = [
      { title: 'Vento', key: 'wind', data: groups.wind },
      { title: 'Onda / Mar', key: 'waves', data: groups.waves },
      { title: 'Floresta', key: 'forest', data: groups.forest },
    ];
    return sections;
  }, [audios]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Biblioteca de Meditações</Text>
        {onClose ? (
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={20} color={Colors.text} />
          </TouchableOpacity>
        ) : null}
      </View>

      <SectionList
        sections={grouped}
        keyExtractor={(item: any) => item._id.toHexString()}
        renderItem={({ item }) => renderItem({ item })}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}><Text style={styles.sectionHeaderText}>{(section as any).title}</Text></View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 10 }} />}
        contentContainerStyle={{ padding: 8 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.white, borderRadius: 12, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.text },
  desc: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  actionBtn: { marginLeft: 10 },
  sectionHeader: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F7F9FB' },
  sectionHeaderText: { fontSize: 14, fontWeight: '700', color: Colors.text },
});

export default AudioLibrary;

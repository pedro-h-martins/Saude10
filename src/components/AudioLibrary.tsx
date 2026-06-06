import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useQuery, useRealm } from '@/context/RealmProvider';
import { GuidedAudio, GuidedAudioType } from '@/models/GuidedAudio';
import { MeditationLog } from '@/models/MeditationLog';
import { deleteCachedAudio, downloadAndCacheAudio, getLocalAudioUri } from '@/services/audioMedia';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  anxiety: { label: 'Ansiedade', icon: 'heart-outline', color: '#E74C3C' },
  focus: { label: 'Foco', icon: 'bulb-outline', color: '#F39C12' },
  sleep: { label: 'Sono', icon: 'moon-outline', color: '#8E44AD' },
  wind: { label: 'Vento', icon: 'leaf-outline', color: '#3498DB' },
  waves: { label: 'Onda / Mar', icon: 'water-outline', color: '#2980B9' },
  forest: { label: 'Floresta', icon: 'rose-outline', color: '#27AE60' },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setDate(now.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

interface SeekBarProps {
  durationMs: number;
  positionMs: number;
  onSeek: (positionMs: number) => void;
  color: string;
}

const SeekBar: React.FC<SeekBarProps> = ({ durationMs, positionMs, onSeek, color }) => {
  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const barWidth = SCREEN_WIDTH - 80;
  const panRef = useRef(new Animated.ValueXY()).current;
  const isDragging = useRef(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => {
          isDragging.current = true;
          return true;
        },
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          const newX = Math.max(0, Math.min(barWidth, gestureState.moveX - 40));
          panRef.setValue({ x: newX, y: 0 });
        },
        onPanResponderRelease: (_, gestureState) => {
          isDragging.current = false;
          const newX = Math.max(0, Math.min(barWidth, gestureState.moveX - 40));
          const ratio = newX / barWidth;
          onSeek(ratio * durationMs);
        },
      }),
    [barWidth, durationMs, onSeek, panRef],
  );

  return (
    <View style={styles.seekContainer}>
      <Text style={styles.seekTime}>{formatTime(positionMs / 1000)}</Text>
      <View style={[styles.seekTrack, { width: barWidth }]}>
        <View style={[styles.seekFill, { width: progress * barWidth, backgroundColor: color }]} />
        <Animated.View
          style={[styles.seekThumb, { left: progress * barWidth - 6, backgroundColor: color }]}
          {...panResponder.panHandlers}
        />
      </View>
      <Text style={styles.seekTime}>{formatTime(durationMs / 1000)}</Text>
    </View>
  );
};

interface AudioItemProps {
  item: GuidedAudio;
  isPlaying: boolean;
  isLoading: boolean;
  playbackPositionMs: number;
  playbackDurationMs: number;
  onPlay: (item: GuidedAudio) => void;
  onPause: () => void;
  onSeek: (positionMs: number) => void;
  onDownload: (item: GuidedAudio) => void;
  onDelete: (item: GuidedAudio) => void;
}

const AudioItem: React.FC<AudioItemProps> = ({
  item,
  isPlaying,
  isLoading,
  playbackPositionMs,
  playbackDurationMs,
  onPlay,
  onPause,
  onSeek,
  onDownload,
  onDelete,
}) => {
  const catConfig = CATEGORY_CONFIG[item.category ?? 'wind'] ?? CATEGORY_CONFIG.wind;
  const hasSource = !!(item.localUri || item.remoteUrl);
  const isGuided = item.type === 'guided';

  return (
    <View style={[styles.audioItem, isGuided && styles.audioItemGuided]}>
      <View style={[styles.audioItemIcon, { backgroundColor: catConfig.color + '18' }]}>
        <Ionicons name={catConfig.icon} size={22} color={catConfig.color} />
      </View>
      <View style={styles.audioItemContent}>
        <Text style={styles.audioItemTitle} numberOfLines={1}>{item.title}</Text>
        {item.description ? <Text style={styles.audioItemDesc} numberOfLines={2}>{item.description}</Text> : null}
        {isGuided && item.duration ? (
          <Text style={styles.audioItemDuration}>{formatTime(item.duration)}</Text>
        ) : null}

        {isPlaying && (
          <SeekBar
            durationMs={playbackDurationMs}
            positionMs={playbackPositionMs}
            onSeek={onSeek}
            color={catConfig.color}
          />
        )}
      </View>

      <View style={styles.audioItemActions}>
        {!hasSource && isGuided ? (
          <View style={styles.placeholderBadge}>
            <Text style={styles.placeholderText}>Em breve</Text>
          </View>
        ) : (
          <>
            {isPlaying ? (
              <TouchableOpacity onPress={onPause} style={styles.actionBtn}>
                <Ionicons name="pause" size={22} color={Colors.primary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => onPlay(item)} style={styles.actionBtn} disabled={!hasSource}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Ionicons name="play" size={22} color={hasSource ? Colors.primary : Colors.textSecondary} />
                )}
              </TouchableOpacity>
            )}

            {item.localUri ? (
              <TouchableOpacity onPress={() => onDelete(item)} style={styles.actionBtn}>
                <Ionicons name="trash-outline" size={18} color={Colors.warning} />
              </TouchableOpacity>
            ) : item.remoteUrl ? (
              <TouchableOpacity onPress={() => onDownload(item)} style={styles.actionBtn}>
                {isLoading ? <ActivityIndicator size="small" /> : <Ionicons name="download-outline" size={18} color={Colors.primary} />}
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
};

const AudioLibrary: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const audios = useQuery(GuidedAudio);
  const meditationLogs = useQuery(MeditationLog);
  const realm = useRealm();
  const [activeTab, setActiveTab] = useState<GuidedAudioType>('guided');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [playbackPositionMs, setPlaybackPositionMs] = useState(0);
  const [playbackDurationMs, setPlaybackDurationMs] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      (async () => {
        if (soundRef.current) {
          try { await soundRef.current.unloadAsync(); } catch {}
        }
      })();
    };
  }, []);

  const weeklyCount = useMemo(() => {
    const { start, end } = getWeekRange();
    return Array.from(meditationLogs).filter(
      (log) => log.completedAt >= start && log.completedAt < end,
    ).length;
  }, [meditationLogs]);

  const guidedAudios = useMemo(
    () => Array.from(audios).filter((a: any) => a.type === 'guided') as GuidedAudio[],
    [audios],
  );

  const ambientAudios = useMemo(
    () => Array.from(audios).filter((a: any) => a.type === 'ambient' || !a.type) as GuidedAudio[],
    [audios],
  );

  const groupedByCategory = useCallback(
    (items: GuidedAudio[], categories: string[]) => {
      const groups: Record<string, GuidedAudio[]> = {};
      categories.forEach((c) => { groups[c] = []; });
      items.forEach((a) => {
        const c = (a.category as string) || categories[0];
        if (!groups[c]) groups[c] = [];
        groups[c].push(a);
      });
      return categories
        .filter((c) => groups[c] && groups[c].length > 0)
        .map((c) => ({
          key: c,
          title: CATEGORY_CONFIG[c]?.label ?? c,
          data: groups[c],
        }));
    },
    [],
  );

  const guidedSections = useMemo(
    () => groupedByCategory(guidedAudios, ['anxiety', 'focus', 'sleep']),
    [guidedAudios, groupedByCategory],
  );

  const ambientSections = useMemo(
    () => groupedByCategory(ambientAudios, ['wind', 'waves', 'forest']),
    [ambientAudios, groupedByCategory],
  );

  const sections = activeTab === 'guided' ? guidedSections : ambientSections;

  const logMeditationCompletion = useCallback(
    (item: GuidedAudio, durationMs: number) => {
      try {
        realm.write(() => {
          realm.create('MeditationLog', {
            _id: new (Realm as any).BSON.ObjectId(),
            audioId: item._id.toHexString(),
            category: item.category ?? 'anxiety',
            completedAt: new Date(),
            durationSeconds: Math.round(durationMs / 1000),
          });
        });
      } catch (e) {
        console.warn('Failed to log meditation completion', e);
      }
    },
    [realm],
  );

  const handlePlay = useCallback(
    async (item: GuidedAudio) => {
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
        setPlaybackPositionMs(0);
        setPlaybackDurationMs(0);
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status && status.isLoaded) {
            setPlaybackPositionMs(status.positionMillis ?? 0);
            setPlaybackDurationMs(status.durationMillis ?? 0);
            if (status.didJustFinish) {
              setPlayingId(null);
              setPlaybackPositionMs(0);
              setPlaybackDurationMs(0);
              if (item.type === 'guided') {
                logMeditationCompletion(item, status.durationMillis ?? 0);
              }
            }
          }
        });
      } catch (e) {
        console.warn('Playback error', e);
      } finally {
        setLoadingId(null);
      }
    },
    [logMeditationCompletion],
  );

  const handlePause = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setPlayingId(null);
    }
  }, []);

  const handleSeek = useCallback(async (positionMs: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(positionMs);
      setPlaybackPositionMs(positionMs);
    }
  }, []);

  const handleDownload = useCallback(
    async (item: GuidedAudio) => {
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
    },
    [realm],
  );

  const handleDelete = useCallback(
    async (item: GuidedAudio) => {
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
    },
    [realm],
  );

  const renderItem = ({ item }: { item: GuidedAudio }) => {
    const id = item._id.toHexString();
    return (
      <AudioItem
        item={item}
        isPlaying={playingId === id}
        isLoading={loadingId === id}
        playbackPositionMs={playingId === id ? playbackPositionMs : 0}
        playbackDurationMs={playingId === id ? playbackDurationMs : 0}
        onPlay={handlePlay}
        onPause={handlePause}
        onSeek={handleSeek}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />
    );
  };

  const renderSectionHeader = ({ section }: { section: { key: string; title: string; data: GuidedAudio[] } }) => {
    const config = CATEGORY_CONFIG[section.key];
    return (
      <View style={styles.sectionHeader}>
        {config && <Ionicons name={config.icon} size={18} color={config.color} style={styles.sectionIcon} />}
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
        <Text style={styles.sectionCount}>
          {section.data.length} {section.data.length === 1 ? 'áudio' : 'áudios'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meditações</Text>
        {onClose ? (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        ) : null}
      </View>

      {weeklyCount > 0 && (
        <View style={styles.weeklyBadge}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.accent} />
          <Text style={styles.weeklyBadgeText}>{weeklyCount} sessão{weeklyCount !== 1 ? 'ões' : ''} esta semana</Text>
        </View>
      )}

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'guided' && styles.tabActive]}
          onPress={() => setActiveTab('guided')}
        >
          <Ionicons
            name="mic-outline"
            size={18}
            color={activeTab === 'guided' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabLabel, activeTab === 'guided' && styles.tabLabelActive]}>
            Meditações Guiadas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ambient' && styles.tabActive]}
          onPress={() => setActiveTab('ambient')}
        >
          <Ionicons
            name="musical-notes-outline"
            size={18}
            color={activeTab === 'ambient' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabLabel, activeTab === 'ambient' && styles.tabLabelActive]}>
            Sons Ambiente
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section.key} style={styles.sectionBlock}>
            {renderSectionHeader({ section })}
            {section.data.map((item) => (
              <View key={item._id.toHexString()} style={styles.itemWrapper}>
                {renderItem({ item })}
              </View>
            ))}
          </View>
        ))}

        {sections.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="mic-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>
              {activeTab === 'guided' ? 'Nenhuma meditação guiada disponível' : 'Nenhum som ambiente disponível'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h2, color: Colors.text },
  closeBtn: { padding: 4 },
  weeklyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8F8EF',
    borderRadius: 16,
    gap: 6,
  },
  weeklyBadgeText: { ...Typography.caption, color: Colors.accent, fontWeight: '600' },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: { backgroundColor: '#F0F4FF' },
  tabLabel: { ...Typography.body, color: Colors.textSecondary, fontWeight: '500' },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },
  scrollArea: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  sectionBlock: { marginTop: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  sectionIcon: { marginTop: 1 },
  sectionHeaderText: { ...Typography.h3, fontSize: 16, flex: 1 },
  sectionCount: { ...Typography.caption, color: Colors.textSecondary },
  itemWrapper: { paddingHorizontal: 20, marginBottom: 8 },
  audioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  audioItemGuided: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  audioItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  audioItemContent: { flex: 1, marginRight: 8 },
  audioItemTitle: { ...Typography.body, fontWeight: '600', color: Colors.text },
  audioItemDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  audioItemDuration: { ...Typography.caption, color: Colors.primary, marginTop: 4, fontWeight: '600' },
  audioItemActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 6, marginLeft: 4 },
  placeholderBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  placeholderText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  seekContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  seekTime: { ...Typography.caption, fontSize: 11, color: Colors.textSecondary, width: 32 },
  seekTrack: {
    height: 4,
    backgroundColor: '#E8E8E8',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  seekFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  seekThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
});

export default AudioLibrary;

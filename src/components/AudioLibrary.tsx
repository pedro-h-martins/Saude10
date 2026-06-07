import { ThemeColors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
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
trackBackgroundColor: string;
}

const SeekBar: React.FC<SeekBarProps> = ({ durationMs, positionMs, onSeek, color, trackBackgroundColor }) => {
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
<Text style={[styles.seekTime, { color: trackBackgroundColor }]}>{formatTime(positionMs / 1000)}</Text>
<View style={[styles.seekTrack, { width: barWidth, backgroundColor: trackBackgroundColor }]}>
<View style={[styles.seekFill, { width: progress * barWidth, backgroundColor: color }]} />
<Animated.View
style={[styles.seekThumb, { left: progress * barWidth - 6, backgroundColor: color }]}
{...panResponder.panHandlers}
/>
</View>
<Text style={[styles.seekTime, { color: trackBackgroundColor }]}>{formatTime(durationMs / 1000)}</Text>
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
colors: ThemeColors;
getCategoryColor: (key: string) => string;
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
colors,
getCategoryColor,
}) => {
const catConfig = CATEGORY_CONFIG[item.category ?? 'wind'] ?? CATEGORY_CONFIG.wind;
const hasSource = !!(item.localUri || item.remoteUrl);
const isGuided = item.type === 'guided';
const categoryColor = getCategoryColor(item.category ?? 'wind');

return (
<View style={[styles.audioItem, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant }, isGuided && { borderLeftWidth: 3, borderLeftColor: colors.primary }]}>
<View style={[styles.audioItemIcon, { backgroundColor: categoryColor + '18' }]}>
<Ionicons name={catConfig.icon} size={22} color={categoryColor} />
</View>
<View style={styles.audioItemContent}>
<Text style={[styles.audioItemTitle, { color: colors.onSurface }]} numberOfLines={1}>{item.title}</Text>
{item.description ? <Text style={[styles.audioItemDesc, { color: colors.onSurfaceVariant }]} numberOfLines={2}>{item.description}</Text> : null}
{isGuided && item.duration ? (
<Text style={[styles.audioItemDuration, { color: colors.primary }]}>{formatTime(item.duration)}</Text>
) : null}

{isPlaying && (
<SeekBar
durationMs={playbackDurationMs}
positionMs={playbackPositionMs}
onSeek={onSeek}
color={categoryColor}
trackBackgroundColor={colors.seekTrackBackground}
/>
)}
</View>

<View style={styles.audioItemActions}>
{!hasSource && isGuided ? (
<View style={[styles.placeholderBadge, { backgroundColor: colors.placeholderBackground }]}>
<Text style={[styles.placeholderText, { color: colors.onSurfaceVariant }]}>Em breve</Text>
</View>
) : (
<>
{isPlaying ? (
<TouchableOpacity onPress={onPause} style={styles.actionBtn}>
<Ionicons name="pause" size={22} color={colors.primary} />
</TouchableOpacity>
) : (
<TouchableOpacity onPress={() => onPlay(item)} style={styles.actionBtn} disabled={!hasSource}>
{isLoading ? (
<ActivityIndicator size="small" color={colors.primary} />
) : (
<Ionicons name="play" size={22} color={hasSource ? colors.primary : colors.onSurfaceVariant} />
)}
</TouchableOpacity>
)}

{item.localUri ? (
<TouchableOpacity onPress={() => onDelete(item)} style={styles.actionBtn}>
<Ionicons name="trash-outline" size={18} color={colors.warning} />
</TouchableOpacity>
) : item.remoteUrl ? (
<TouchableOpacity onPress={() => onDownload(item)} style={styles.actionBtn}>
{isLoading ? <ActivityIndicator size="small" /> : <Ionicons name="download-outline" size={18} color={colors.primary} />}
</TouchableOpacity>
) : null}
</>
)}
</View>
</View>
);
};

const AudioLibrary: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
const { colors } = useTheme();
const audios = useQuery(GuidedAudio);
const meditationLogs = useQuery(MeditationLog);
const realm = useRealm();
const [activeTab, setActiveTab] = useState<GuidedAudioType>('guided');
const [playingId, setPlayingId] = useState<string | null>(null);
const [loadingId, setLoadingId] = useState<string | null>(null);
const [playbackPositionMs, setPlaybackPositionMs] = useState(0);
const [playbackDurationMs, setPlaybackDurationMs] = useState(0);
const soundRef = useRef<Audio.Sound | null>(null);

const getCategoryColor = useCallback((key: string) => {
const map: Record<string, string> = {
anxiety: colors.audioAnxiety,
focus: colors.audioFocus,
sleep: colors.audioSleep,
wind: colors.audioWind,
waves: colors.audioWaves,
forest: colors.audioForest,
};
return map[key] ?? colors.audioWind;
}, [colors]);

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
colors={colors}
getCategoryColor={getCategoryColor}
/>
);
};

const renderSectionHeader = ({ section }: { section: { key: string; title: string; data: GuidedAudio[] } }) => {
const config = CATEGORY_CONFIG[section.key];
const sectionColor = getCategoryColor(section.key);
return (
<View style={styles.sectionHeader}>
{config && <Ionicons name={config.icon} size={18} color={sectionColor} style={styles.sectionIcon} />}
<Text style={[styles.sectionHeaderText, { color: colors.onSurface }]}>{section.title}</Text>
<Text style={[styles.sectionCount, { color: colors.onSurfaceVariant }]}>
{section.data.length} {section.data.length === 1 ? 'áudio' : 'áudios'}
</Text>
</View>
);
};

return (
<View style={[styles.container, { backgroundColor: colors.background }]}>
<View style={[styles.header, { backgroundColor: colors.surfaceContainerLowest, borderBottomColor: colors.outlineVariant }]}>
<Text style={[styles.headerTitle, { color: colors.onSurface }]}>Meditações</Text>
{onClose ? (
<TouchableOpacity onPress={onClose} style={styles.closeBtn}>
<Ionicons name="close" size={24} color={colors.onSurface} />
</TouchableOpacity>
) : null}
</View>

{weeklyCount > 0 && (
<View style={[styles.weeklyBadge, { backgroundColor: colors.accent + '20' }]}>
<Ionicons name="checkmark-circle" size={16} color={colors.accent} />
<Text style={[styles.weeklyBadgeText, { color: colors.accent }]}>{weeklyCount} sessão{weeklyCount !== 1 ? 'ões' : ''} esta semana</Text>
</View>
)}

<View style={[styles.tabBar, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant }]}>
<TouchableOpacity
style={[styles.tab, activeTab === 'guided' && styles.tabActive, activeTab === 'guided' && { backgroundColor: colors.primaryContainer + '20' }]}
onPress={() => setActiveTab('guided')}
>
<Ionicons
name="mic-outline"
size={18}
color={activeTab === 'guided' ? colors.primary : colors.onSurfaceVariant}
/>
<Text style={[styles.tabLabel, { color: colors.onSurfaceVariant }, activeTab === 'guided' && { color: colors.primary }]}>
Meditações Guiadas
</Text>
</TouchableOpacity>
<TouchableOpacity
style={[styles.tab, activeTab === 'ambient' && styles.tabActive, activeTab === 'ambient' && { backgroundColor: colors.primaryContainer + '20' }]}
onPress={() => setActiveTab('ambient')}
>
<Ionicons
name="musical-notes-outline"
size={18}
color={activeTab === 'ambient' ? colors.primary : colors.onSurfaceVariant}
/>
<Text style={[styles.tabLabel, { color: colors.onSurfaceVariant }, activeTab === 'ambient' && { color: colors.primary }]}>
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
<Ionicons name="mic-outline" size={48} color={colors.outlineVariant} />
<Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
{activeTab === 'guided' ? 'Nenhuma meditação guiada disponível' : 'Nenhum som ambiente disponível'}
</Text>
</View>
)}
</ScrollView>
</View>
);
};

const styles = StyleSheet.create({
container: { flex: 1 },
header: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
paddingHorizontal: 20,
paddingVertical: 16,
borderBottomWidth: 1,
},
headerTitle: { ...Typography.titleLarge },
closeBtn: { padding: 4 },
weeklyBadge: {
flexDirection: 'row',
alignItems: 'center',
alignSelf: 'flex-start',
marginHorizontal: 20,
marginTop: 12,
paddingHorizontal: 12,
paddingVertical: 6,
borderRadius: 16,
gap: 6,
},
weeklyBadgeText: { ...Typography.labelMedium, fontWeight: '600' },
tabBar: {
flexDirection: 'row',
marginHorizontal: 20,
marginTop: 16,
marginBottom: 8,
borderRadius: 12,
borderWidth: 1,
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
tabActive: {
},
tabLabel: { ...Typography.bodyMedium, fontWeight: '500' },
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
sectionHeaderText: { ...Typography.titleMedium, fontSize: 16, flex: 1 },
sectionCount: { ...Typography.labelMedium },
itemWrapper: { paddingHorizontal: 20, marginBottom: 8 },
audioItem: {
flexDirection: 'row',
alignItems: 'center',
borderRadius: 14,
padding: 14,
borderWidth: 1,
},
audioItemGuided: {
},
audioItemIcon: {
width: 44,
height: 44,
borderRadius: 22,
justifyContent: 'center',
alignItems: 'center',
marginRight: 12,
},
audioItemContent: { flex: 1, marginRight: 8 },
audioItemTitle: { ...Typography.bodyMedium, fontWeight: '600' },
audioItemDesc: { ...Typography.labelMedium, marginTop: 2, lineHeight: 16 },
audioItemDuration: { ...Typography.labelMedium, marginTop: 4, fontWeight: '600' },
audioItemActions: { flexDirection: 'row', alignItems: 'center' },
actionBtn: { padding: 6, marginLeft: 4 },
placeholderBadge: {
paddingHorizontal: 10,
paddingVertical: 4,
borderRadius: 8,
},
placeholderText: { ...Typography.labelMedium, fontWeight: '600' },
seekContainer: {
flexDirection: 'row',
alignItems: 'center',
marginTop: 10,
gap: 8,
},
seekTime: { ...Typography.labelMedium, fontSize: 11, width: 32 },
seekTrack: {
height: 4,
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
emptyText: { ...Typography.bodyMedium },
});

export default AudioLibrary;

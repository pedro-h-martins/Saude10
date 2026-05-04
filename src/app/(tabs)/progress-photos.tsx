import { Card } from '@/components/Card';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@/context/RealmProvider';
import { useSync } from '@/hooks/useSync';
import { ProgressPhoto } from '@/models/ProgressPhoto';
import { compressAndStoreProgressPhoto } from '@/services/imageMedia';
import { Realm } from '@realm/react';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatCapturedAt = (date: Date) =>
  `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

const getStatusText = (status: ProgressPhoto['status']) => {
  switch (status) {
    case 'synced':
      return 'Sincronizado';
    case 'failed':
      return 'Falha';
    default:
      return 'Pendente';
  }
};

export default function ProgressPhotosScreen() {
  const { currentUser } = useAuth();
  const photosQuery = useQuery(ProgressPhoto);
  const photos = currentUser
    ? photosQuery.filtered('userId == $0', currentUser._id).sorted('capturedAt', true)
    : photosQuery.sorted('capturedAt', true);
  const { save } = useSync();
  const [isSaving, setIsSaving] = useState(false);

  const handleLaunchPicker = useCallback(
    async (useCamera: boolean) => {
      if (!currentUser) {
        Alert.alert('Usuário não autenticado.');
        return;
      }

      try {
        const permissions = useCamera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissions.granted) {
          Alert.alert('Permissão necessária', 'Permissão de câmera ou galeria é necessária para registrar a foto.');
          return;
        }

        const result = useCamera
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1, allowsEditing: true })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1, allowsEditing: true });

        if (result.canceled || !result.assets?.[0]?.uri) {
          return;
        }

        setIsSaving(true);
        const photoId = new Realm.BSON.ObjectId();
        const asset = result.assets[0];
        const { localUri, width, height, fileSize } = await compressAndStoreProgressPhoto(asset.uri, photoId.toHexString());

        await save('ProgressPhoto', photoId.toHexString(), {
          _id: photoId,
          userId: currentUser._id,
          capturedAt: new Date(),
          localUri,
          status: 'pending',
          width: width ? Math.floor(width) : undefined,
          height: height ? Math.floor(height) : undefined,
          fileSize: fileSize ? Math.floor(fileSize) : undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        Alert.alert('Foto registrada', 'Sua foto foi salva na linha do tempo privada.');
      } catch (error) {
        console.error(error);
        Alert.alert('Erro', 'Não foi possível salvar a foto.');
      } finally {
        setIsSaving(false);
      }
    },
    [currentUser, save]
  );

  const renderPhotoItem = ({ item }: { item: ProgressPhoto }) => (
    <Card style={styles.photoCard} key={item._id.toHexString()}>
      <Image source={{ uri: item.localUri }} style={styles.photoImage} />
      <View style={styles.photoDetails}>
        <Text style={styles.photoDate}>{formatCapturedAt(item.capturedAt)}</Text>
        <Text style={[styles.photoStatus, item.status === 'synced' ? styles.statusSynced : item.status === 'failed' ? styles.statusFailed : styles.statusPending]}>
          {getStatusText(item.status)}
        </Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={Typography.h1}>Evolução Física</Text>
        <Text style={Typography.caption}>Registre fotos semanais para acompanhar sua evolução de forma privada.</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonSpacing]} onPress={() => handleLaunchPicker(true)} disabled={isSaving}>
          <Text style={styles.actionButtonText}>Câmera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleLaunchPicker(false)} disabled={isSaving}>
          <Text style={styles.actionButtonText}>Galeria</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={Array.from(photos)}
        keyExtractor={(item) => item._id.toHexString()}
        renderItem={renderPhotoItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={Typography.body}>Nenhuma foto registrada ainda.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  actionButtonSpacing: {
    marginRight: 12,
  },
  actionButtonText: {
    ...Typography.body,
    color: Colors.white,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  photoCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 14,
    backgroundColor: Colors.border,
  },
  photoDetails: {
    padding: 12,
    backgroundColor: Colors.white,
  },
  photoDate: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  photoStatus: {
    ...Typography.caption,
  },
  statusSynced: {
    color: Colors.accent,
  },
  statusPending: {
    color: Colors.primary,
  },
  statusFailed: {
    color: Colors.warning,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
});

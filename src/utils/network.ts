import * as Network from 'expo-network';

export async function isOnline(): Promise<boolean> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return !!networkState.isConnected && networkState.isInternetReachable !== false;
  } catch (error) {
    console.warn('Error checking network status:', error);
    return true;
  }
}

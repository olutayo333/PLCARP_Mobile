import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import {
    useGetCommunitiesQuery,
    useSubscribeToCommunityMutation,
    useUnsubscribeFromCommunityMutation
} from '../services/communityApi';
import { CommunityCard } from '../components/CommunityCard';
import { Skeleton } from '../components/common/Skeleton';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export function CommunitiesScreen({ search, page, limit }: { search?: string; page?: number; limit?: number }) {
    const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
    const { data, isLoading, refetch } = useGetCommunitiesQuery({ search, page, limit });
    const [subscribe] = useSubscribeToCommunityMutation();
    const [unsubscribe] = useUnsubscribeFromCommunityMutation();

    const handleCommunityAction = async (community: any) => {
        if (!isLoggedIn) {
            Alert.alert(
                'Join Community',
                'Please register and login to join this community.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Login', onPress: () => { /* Navigation handled by parent or context if needed, but for now just alert */ } }
                ]
            );
            return;
        }

        try {
            if (community.joined) {
                // Confirm leave
                Alert.alert(
                    'Leave Community',
                    `Are you sure you want to leave ${community.name}?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Leave',
                            style: 'destructive',
                            onPress: async () => {
                                try {
                                    await unsubscribe(community.id).unwrap();
                                } catch (err: any) {
                                    Alert.alert('Error', err?.data?.message || 'Failed to leave community');
                                }
                            }
                        }
                    ]
                );
            } else {
                await subscribe(community.id).unwrap();
            }
        } catch (err: any) {
            Alert.alert('Error', err?.data?.message || 'Failed to update subscription');
        }
    };

    const CommunitySkeleton = () => (
        <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Skeleton width={60} height={60} borderRadius={12} />
                <View style={{ marginLeft: 16, flex: 1 }}>
                    <Skeleton width="20%" height={10} style={{ marginBottom: 4 }} />
                    <Skeleton width="60%" height={18} style={{ marginBottom: 8 }} />
                    <Skeleton width="40%" height={12} />
                </View>
                <Skeleton width={24} height={24} borderRadius={12} />
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.screenHeader}>
                    <Text style={styles.screenTitle}>Communities</Text>
                </View>
                <View style={{ padding: 16 }}>
                    {[1, 2, 3, 4, 5, 6].map(i => <CommunitySkeleton key={i} />)}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.screenHeader}>
                <Text style={styles.screenTitle}>Communities</Text>
            </View>


            <FlatList
                data={data?.communities || []}
                renderItem={({ item }) => (
                    <CommunityCard
                        community={item}
                        isLoggedIn={isLoggedIn}
                        onPress={() => handleCommunityAction(item)}
                    />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.communityList}
                onRefresh={refetch}
                refreshing={isLoading}
                ListEmptyComponent={() => {
                    if (isLoading) return null;
                    return (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No communities found</Text>
                        </View>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    screenHeader: {
        padding: 16,
        backgroundColor: '#fff',
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    communityList: {
        padding: 16,
        paddingBottom: 100,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
    },
});

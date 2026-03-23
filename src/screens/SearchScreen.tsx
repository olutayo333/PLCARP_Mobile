import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    FlatList,
    ActivityIndicator,
    Dimensions,
    Platform,
} from 'react-native';
import { Skeleton } from '../components/common/Skeleton';
import {
    Search,
    X,
    ChevronDown,
    ChevronRight,
    ShieldCheck,
    Share2,
    MessageCircle,
    Eye,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useGetExpertsQuery } from '../services/profileApi';
import { CommunityCard } from '../components/CommunityCard';

export function SearchScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [activeSearchTab, setActiveSearchTab] = useState('forum');

    const { data: expertsData, isLoading: isLoadingExperts } = useGetExpertsQuery(
        { search: searchQuery },
        { skip: !isSearching || activeSearchTab !== 'experts' }
    );

    const recentSearches = ['Policy Advocacy', 'Leadership', 'Human Resources', 'Environmental'];
    const trendingTopics = [
        'Communication and Advocacy strategies for rural NGOs',
        'Communication and Advocacy strategies for rural NGOs',
        'Communication and Advocacy strategies for rural NGOs'
    ];

    const renderInitialView = () => (
        <ScrollView style={styles.searchInitial}>
            <View style={styles.searchSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>RECENT SEARCHES</Text>
                    <TouchableOpacity><Text style={styles.clearAll}>Clear all</Text></TouchableOpacity>
                </View>
                {recentSearches.map(item => (
                    <View key={item} style={styles.recentItem}>
                        <Text style={styles.recentText}>{item}</Text>
                        <X size={16} color="#9ca3af" />
                    </View>
                ))}
            </View>

            <View style={styles.searchSection}>
                <Text style={styles.sectionTitle}>TRENDING IN FORUM</Text>
                {trendingTopics.map((item, idx) => (
                    <View key={idx} style={styles.trendingItem}>
                        <View style={styles.trendingIcon}><Text style={styles.trendingIconText}>AJ</Text></View>
                        <View style={styles.trendingContent}>
                            <Text style={styles.trendingTitle} numberOfLines={1}>{item}</Text>
                            <View style={styles.trendingMeta}>
                                <Share2 size={12} color="#9ca3af" />
                                <View style={styles.statItemRow}>
                                    <MessageCircle size={12} color="#9ca3af" />
                                    <Text style={styles.statTextSmall}>8</Text>
                                </View>
                                <View style={styles.statItemRow}>
                                    <Eye size={12} color="#9ca3af" />
                                    <Text style={styles.statTextSmall}>124</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ))}
            </View>
            <View style={styles.searchSection}>
                <Text style={styles.sectionTitle}>POPULAR COMMUNITIES</Text>
                <View style={styles.popularCommunitiesList}>
                    <CommunityCard community={{ id: '1', name: 'Policy Advocacy', category: 'Advocacy', memberCount: 124, topicCount: 8 } as any} />
                    <CommunityCard community={{ id: '2', name: 'Communications for Advocacy', category: 'Advocacy', memberCount: 124, topicCount: 8 } as any} />
                    <TouchableOpacity style={styles.loadMoreBtn}>
                        <Text style={styles.loadMoreBtnText}>Load more results</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );

    const renderResultsView = () => (
        <View style={styles.searchResults}>
            <View style={styles.searchSubTabs}>
                <TouchableOpacity
                    style={[styles.searchSubTab, activeSearchTab === 'forum' && styles.searchSubTabActive]}
                    onPress={() => setActiveSearchTab('forum')}
                >
                    <Text style={[styles.searchSubTabText, activeSearchTab === 'forum' && styles.searchSubTabTextActive]}>Forum</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.searchSubTab, activeSearchTab === 'experts' && styles.searchSubTabActive]}
                    onPress={() => setActiveSearchTab('experts')}
                >
                    <Text style={[styles.searchSubTabText, activeSearchTab === 'experts' && styles.searchSubTabTextActive]}>Experts</Text>
                </TouchableOpacity>
            </View>

            {activeSearchTab === 'forum' ? (
                <View style={styles.resultsList}>
                    <View style={styles.resultsHeader}>
                        <TouchableOpacity style={styles.filterToggle}>
                            <Text style={styles.filterToggleText}>Filters</Text>
                        </TouchableOpacity>
                        <View style={styles.sortInfo}>
                            <Text style={styles.sortLabel}>Sort: <Text style={styles.sortValue}>Relevance</Text></Text>
                            <ChevronDown size={16} color="#374151" />
                        </View>
                    </View>
                    <Text style={styles.resultsCount}>SEARCH RESULTS</Text>
                    <View style={styles.centered}><Text style={styles.emptyText}>No results found for "{searchQuery}"</Text></View>
                </View>
            ) : (
                <View style={styles.resultsList}>
                    <Text style={styles.resultsCount}>EXPERT DIRECTORY</Text>
                    {isLoadingExperts ? (
                        <View style={{ paddingHorizontal: 16 }}>
                            {[1, 2, 3].map(i => (
                                <View key={i} style={[styles.expertCard, { marginHorizontal: 0 }]}>
                                    <View style={styles.expertCardHeader}>
                                        <Skeleton width={44} height={44} borderRadius={22} />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Skeleton width="60%" height={16} style={{ marginBottom: 6 }} />
                                            <Skeleton width="40%" height={12} />
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
                                        <Skeleton width={60} height={16} borderRadius={4} />
                                        <Skeleton width={80} height={12} />
                                    </View>
                                    <Skeleton width="100%" height={14} style={{ marginBottom: 6 }} />
                                    <Skeleton width="80%" height={14} style={{ marginBottom: 12 }} />
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <Skeleton width={50} height={20} borderRadius={4} />
                                        <Skeleton width={50} height={20} borderRadius={4} />
                                        <Skeleton width={50} height={20} borderRadius={4} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <FlatList
                            data={expertsData?.experts || []}
                            renderItem={({ item }) => (
                                <ExpertCard
                                    expert={item}
                                    onPress={(id) => navigation.navigate('ExpertDetail', { expertId: id })}
                                />
                            )}
                            keyExtractor={(item) => item.id}
                            ListEmptyComponent={() => (
                                <View style={styles.centered}><Text style={styles.emptyText}>No experts found for "{searchQuery}"</Text></View>
                            )}
                        />
                    )}
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchHeader}>
                <Text style={styles.screenTitle}>Search</Text>
                <View style={styles.searchBarLarge}>
                    <Search size={20} color="#9ca3af" />
                    <TextInput
                        style={styles.searchBarInput}
                        placeholder="Search forum..."
                        value={searchQuery}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            setIsSearching(text.length > 0);
                        }}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); setIsSearching(false); }}>
                            <X size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            {isSearching ? renderResultsView() : renderInitialView()}
        </View>
    );
}

function ExpertCard({ expert, onPress }: { expert: any; onPress: (id: string) => void }) {
    return (
        <TouchableOpacity style={styles.expertCard} onPress={() => onPress(expert.id)}>
            <View style={styles.expertCardHeader}>
                <View style={styles.expertAvatar}>
                    <Text style={styles.expertAvatarText}>
                        {expert.fullName?.charAt(0) || 'E'}
                    </Text>
                </View>
                <View style={styles.expertInfo}>
                    <Text style={styles.expertName}>{expert.fullName}</Text>
                    <Text style={styles.expertTitle}>{expert.expertProfile?.title || 'Expert'}</Text>
                </View>
                <ChevronRight size={20} color="#9ca3af" />
            </View>
            <View style={styles.expertMeta}>
                <View style={styles.expertBadge}>
                    <ShieldCheck size={12} color="#0e7490" />
                    <Text style={styles.expertBadgeText}>Verified</Text>
                </View>
                <Text style={styles.expertExperience}>{expert.expertProfile?.yearsOfExperience || 0} years exp.</Text>
            </View>
            <Text style={styles.expertAbout} numberOfLines={2}>
                {expert.expertProfile?.about || 'No description available.'}
            </Text>
            <View style={styles.expertTags}>
                {expert.expertProfile?.areasOfExpertise?.slice(0, 3).map((tag: string) => (
                    <View key={tag} style={styles.expertTag}>
                        <Text style={styles.expertTagText}>{tag}</Text>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    searchHeader: {
        padding: 16,
        gap: 16,
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    searchBarLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    searchBarInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#111827',
        ...Platform.select({
            web: {
                outlineStyle: 'none',
            },
        }),
    },
    searchInitial: {
        flex: 1,
    },
    searchSection: {
        padding: 16,
        gap: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9ca3af',
        letterSpacing: 0.5,
    },
    clearAll: {
        fontSize: 12,
        color: '#ef4444',
        fontWeight: '600',
    },
    recentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    recentText: {
        fontSize: 14,
        color: '#374151',
    },
    trendingItem: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    trendingIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#0e7490',
        alignItems: 'center',
        justifyContent: 'center',
    },
    trendingIconText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    trendingContent: {
        flex: 1,
        gap: 4,
    },
    trendingTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    trendingMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statTextSmall: {
        fontSize: 12,
        color: '#6b7280',
    },
    searchResults: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    searchSubTabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    searchSubTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    searchSubTabActive: {
        borderBottomColor: '#0e7490',
    },
    searchSubTabText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    searchSubTabTextActive: {
        color: '#0e7490',
        fontWeight: 'bold',
    },
    resultsList: {
        flex: 1,
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    filterToggle: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    filterToggleText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    sortInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sortLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    sortValue: {
        color: '#111827',
        fontWeight: 'bold',
    },
    resultsCount: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9ca3af',
        padding: 16,
        letterSpacing: 0.5,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
    },
    popularCommunitiesList: {
        gap: 12,
    },
    loadMoreBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    loadMoreBtnText: {
        fontSize: 14,
        color: '#0e7490',
        fontWeight: 'bold',
    },
    expertCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        marginHorizontal: 16,
    },
    expertCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    expertAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    expertAvatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0e7490',
    },
    expertInfo: {
        flex: 1,
    },
    expertName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    expertTitle: {
        fontSize: 12,
        color: '#6b7280',
    },
    expertMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    expertBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    expertBadgeText: {
        fontSize: 10,
        color: '#0e7490',
        fontWeight: 'bold',
    },
    expertExperience: {
        fontSize: 12,
        color: '#9ca3af',
    },
    expertAbout: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
        marginBottom: 12,
    },
    expertTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    expertTag: {
        backgroundColor: '#f9fafb',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    expertTagText: {
        fontSize: 12,
        color: '#6b7280',
    },
});

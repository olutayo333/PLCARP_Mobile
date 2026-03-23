import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Skeleton } from '../components/common/Skeleton';
import {
    ArrowLeft,
    Share2,
    ShieldCheck,
    BookOpen,
} from 'lucide-react-native';
import { useGetExpertByIdQuery } from '../services/profileApi';

interface ExpertDetailScreenProps {
    expertId: string;
    onBack: () => void;
}

export function ExpertDetailScreen({ expertId, onBack }: ExpertDetailScreenProps) {
    const { data: expert, isLoading } = useGetExpertByIdQuery(expertId);

    const ExpertDetailSkeleton = () => (
        <View style={styles.container}>
            <View style={styles.header}>
                <Skeleton width={24} height={24} borderRadius={12} />
                <Skeleton width={120} height={20} />
                <Skeleton width={24} height={24} borderRadius={12} />
            </View>
            <View style={styles.content}>
                <View style={styles.profileCard}>
                    <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 16 }} />
                    <Skeleton width="60%" height={24} style={{ marginBottom: 8 }} />
                    <Skeleton width="40%" height={16} style={{ marginBottom: 24 }} />
                    <View style={styles.stats}>
                        <View style={styles.statItem}>
                            <Skeleton width={30} height={20} style={{ marginBottom: 4 }} />
                            <Skeleton width={60} height={12} />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Skeleton width={60} height={20} style={{ marginBottom: 4 }} />
                            <Skeleton width={50} height={12} />
                        </View>
                    </View>
                    <Skeleton width="100%" height={48} borderRadius={24} style={{ marginTop: 24 }} />
                </View>
                <View style={styles.section}>
                    <Skeleton width={80} height={18} style={{ marginBottom: 16 }} />
                    <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
                    <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
                    <Skeleton width="80%" height={14} />
                </View>
            </View>
        </View>
    );

    if (isLoading) {
        return <ExpertDetailSkeleton />;
    }

    if (!expert) {
        return (
            <View style={styles.centered}>
                <Text>Expert not found</Text>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack}>
                    <ArrowLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Expert Profile</Text>
                <TouchableOpacity>
                    <Share2 size={24} color="#111827" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {expert.fullName?.charAt(0) || 'E'}
                        </Text>
                    </View>
                    <Text style={styles.name}>{expert.fullName}</Text>
                    <Text style={styles.title}>{expert.expertProfile?.title || 'Expert'}</Text>

                    <View style={styles.stats}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{expert.expertProfile?.yearsOfExperience || 0}</Text>
                            <Text style={styles.statLabel}>Years Exp.</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>Verified</Text>
                            <Text style={styles.statLabel}>Status</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.connectBtn}>
                        <Text style={styles.connectBtnText}>Connect with Expert</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.aboutText}>
                        {expert.expertProfile?.about || 'No description available.'}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Areas of Expertise</Text>
                    <View style={styles.tags}>
                        {expert.expertProfile?.areasOfExpertise?.map((tag: string) => (
                            <View key={tag} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {expert.expertProfile?.education && expert.expertProfile.education.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Education</Text>
                        {expert.expertProfile.education.map((edu: any, idx: number) => (
                            <View key={idx} style={styles.eduItem}>
                                <BookOpen size={16} color="#0e7490" />
                                <View style={styles.eduContent}>
                                    <Text style={styles.eduTitle}>{edu.certification}</Text>
                                    <Text style={styles.eduSub}>{edu.institution} • {edu.year}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    content: {
        flex: 1,
    },
    profileCard: {
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 8,
        borderBottomColor: '#f9fafb',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0e7490',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    title: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    stats: {
        flexDirection: 'row',
        marginTop: 24,
        alignItems: 'center',
        gap: 24,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: '#e5e7eb',
    },
    connectBtn: {
        marginTop: 24,
        backgroundColor: '#0e7490',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
        width: '100%',
        alignItems: 'center',
    },
    connectBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    section: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    aboutText: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 22,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 12,
        color: '#4b5563',
        fontWeight: '500',
    },
    eduItem: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    eduContent: {
        flex: 1,
    },
    eduTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    eduSub: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    backBtn: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
    },
    backBtnText: {
        color: '#0e7490',
        fontWeight: 'bold',
    },
});

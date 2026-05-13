import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { ArrowLeft, Shield, Users, MessageSquare, AlertTriangle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function CommunityGuidelinesScreen({ navigation }: { navigation: any }) {
    const insets = useSafeAreaInsets();

    const GuidelineSection = ({ icon: Icon, title, content }: { icon: any, title: string, content: string }) => (
        <View style={styles.guidelineBox}>
            <View style={styles.iconContainer}>
                <Icon size={24} color="#0e7490" />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.guidelineTitle}>{title}</Text>
                <Text style={styles.guidelineText}>{content}</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Community Guidelines</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <View style={styles.introCard}>
                    <Text style={styles.introText}>
                        Welcome to the PLRCAP community! To maintain a safe and productive environment for everyone, please follow these guidelines.
                    </Text>
                </View>

                <View style={styles.guidelineList}>
                    <GuidelineSection
                        icon={Users}
                        title="Be Respectful"
                        content="Engage with others professionally. We have zero tolerance for hate speech, harassment, or personal attacks."
                    />

                    <GuidelineSection
                        icon={Shield}
                        title="Protect Privacy"
                        content="Do not share personal information of others. Respect confidentiality and maintain the trust of the hub."
                    />

                    <GuidelineSection
                        icon={MessageSquare}
                        title="Stay Relevant"
                        content="Keep discussions focused on the community's objective. Off-topic posts or spam will be removed."
                    />

                    <GuidelineSection
                        icon={Shield}
                        title="Child Safety"
                        content="We have absolute zero tolerance for any content that facilitates child sexual abuse or exploitation (CSAE). We will remove such content immediately and report it to the relevant authorities."
                    />

                    <GuidelineSection
                        icon={AlertTriangle}
                        title="Safety & Restricted Content"
                        content="Do not promote illegal activities, excessive violence, or share dangerous content. Sexual content, nudity, and promotion of tobacco/nicotine are strictly prohibited."
                    />
                </View>

                <View style={styles.footerNote}>
                    <Text style={styles.footerText}>
                        Violating these guidelines may result in content removal or account suspension. Let's work together to build a strong community.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    content: {
        padding: 20,
    },
    introCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    introText: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 24,
        textAlign: 'center',
    },
    guidelineList: {
        gap: 16,
    },
    guidelineBox: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#e0f2fe',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    guidelineTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    guidelineText: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    footerNote: {
        marginTop: 32,
        padding: 20,
        backgroundColor: '#fff1f2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    footerText: {
        fontSize: 13,
        color: '#b91c1c',
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '500',
    },
});

import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    LayoutAnimation,
    Platform,
    UIManager,
    Linking,
} from 'react-native';
import { ArrowLeft, ChevronDown, ChevronUp, Mail, Linkedin, Twitter } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItem {
    question: string;
    answer: string;
}

const FAQ_DATA: FAQItem[] = [
    {
        question: "How do I join a community?",
        answer: "Navigate to the 'Communities' tab, browse the available communities, and tap 'Join' on any community that interests you. You'll then be able to see and participate in all topics within that community."
    },
    {
        question: "How do I create a new topic?",
        answer: "Tap the '+' floating button on the Home screen or go into a specific community and look for the 'Create Topic' button. Enter a catchy title and detailed content to start the discussion."
    },
    {
        question: "How are my points calculated?",
        answer: "You earn points by being an active member of the hub. This includes creating engaging topics, receiving likes on your posts, and contributing quality comments to discussions."
    },
    {
        question: "How can I report inappropriate content?",
        answer: "Every topic and comment has a 'Report' option. If you see something that violates our community guidelines, please tap Report and specify the reason. Our moderation team will review it promptly."
    },
    {
        question: "How do I update my profile?",
        answer: "On your Profile page, tap 'Edit Profile' to update your name, phone number, and avatar. If you're an expert or NGO, you can also update your professional details through their respective sections."
    }
];

export function HelpSupportScreen({ navigation }: { navigation: any }) {
    const insets = useSafeAreaInsets();
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

    const toggleExpand = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleEmailSupport = () => {
        Linking.openURL('mailto:info@ngosupporthub.ng');
    };

    const handleLinkedInSupport = () => {
        Linking.openURL('https://www.linkedin.com/company/plrcap-ngohub');
    };

    const handleXSupport = () => {
        Linking.openURL('https://x.com/PLRCAPNGOHUB/status/1854456247069650971');
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                
                <View style={styles.faqList}>
                    {FAQ_DATA.map((item, index) => {
                        const isExpanded = expandedIndex === index;
                        return (
                            <View key={index} style={styles.faqItem}>
                                <TouchableOpacity 
                                    style={styles.faqHeader} 
                                    onPress={() => toggleExpand(index)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.questionText}>{item.question}</Text>
                                    {isExpanded ? (
                                        <ChevronUp size={20} color="#0e7490" />
                                    ) : (
                                        <ChevronDown size={20} color="#9ca3af" />
                                    )}
                                </TouchableOpacity>
                                {isExpanded && (
                                    <View style={styles.faqAnswer}>
                                        <Text style={styles.answerText}>{item.answer}</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>

                <View style={styles.contactSection}>
                    <Text style={styles.contactTitle}>Need more help?</Text>
                    <Text style={styles.contactSubtitle}>Contact us through any of the channels available</Text>
                    
                    <View style={styles.contactButtons}>
                        <TouchableOpacity style={styles.contactButton} onPress={handleEmailSupport}>
                            <Mail size={18} color="#0e7490" />
                            <Text style={styles.contactButtonText}>Email</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.contactButton} onPress={handleLinkedInSupport}>
                            <Linkedin size={18} color="#0e7490" />
                            <Text style={styles.contactButtonText}>LinkedIn</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.contactButton} onPress={handleXSupport}>
                            <Twitter size={18} color="#0e7490" />
                            <Text style={styles.contactButtonText}>X (Twitter)</Text>
                        </TouchableOpacity>
                    </View>
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
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 16,
    },
    faqList: {
        gap: 12,
        marginBottom: 32,
    },
    faqItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    questionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
        marginRight: 10,
    },
    faqAnswer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: '#f8fafc',
    },
    answerText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
    },
    contactSection: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    contactSubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 20,
    },
    contactButtons: {
        flexDirection: 'column',
        gap: 12,
        width: '100%',
    },
    contactButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#f0f9ff',
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0f2fe',
    },
    contactButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0e7490',
    },
});

import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { ArrowLeft, Book } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function TermsOfServiceScreen({ navigation }: { navigation: any }) {
    const insets = useSafeAreaInsets();

    const Section = ({ title, content }: { title: string, content: string }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionText}>{content}</Text>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms of Service</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <View style={styles.introBox}>
                    <Book size={32} color="#0e7490" />
                    <Text style={styles.introTitle}>Legal Agreement</Text>
                    <Text style={styles.lastUpdated}>Last Updated: March 25, 2026</Text>
                </View>

                <Section 
                    title="1. Acceptance of Terms"
                    content="By accessing or using the PLRCAP platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application."
                />

                <Section 
                    title="2. User Accounts"
                    content="You are responsible for maintaining the confidentiality of your account credentials. All activities under your account are your responsibility. You must provide accurate and complete information during registration."
                />

                <Section 
                    title="3. Content Ownership"
                    content="You retain ownership of the content you post, but you grant PLRCAP a non-exclusive, worldwide, royalty-free license to use, reproduce, and distribute your content across our services."
                />

                <Section 
                    title="4. Prohibited Conduct"
                    content="Users are prohibited from using the service for any unlawful purposes, infringing on intellectual property, or attempting to compromise the security of the platform."
                />

                <Section 
                    title="5. Limitation of Liability"
                    content="PLRCAP shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services."
                />

                <Section 
                    title="6. Termination"
                    content="We reserve the right to suspend or terminate your account at our sole discretion, without notice, for behavior that violates these terms or our community guidelines."
                />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        If you have any questions regarding these terms, please contact us at legal@plrcap.org
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
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
        padding: 24,
    },
    introBox: {
        alignItems: 'center',
        marginBottom: 32,
    },
    introTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 12,
    },
    lastUpdated: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 4,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    sectionText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
    },
    footer: {
        marginTop: 20,
        padding: 20,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
    },
    footerText: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
    },
});

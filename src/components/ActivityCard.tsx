import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Heart, MessageCircle } from 'lucide-react-native';

export function ActivityCard({ activity }: { activity: any }) {
    return (
        <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
                <Text style={styles.activityTitle} numberOfLines={1}>Re: {activity.topicTitle}</Text>
                <Text style={styles.activityMeta}>by <Text style={styles.authorNameLink}>{activity.authorName}</Text> • {activity.date}</Text>
            </View>
            <Text style={styles.activityBody}>{activity.body}</Text>
            <View style={styles.activityActions}>
                <TouchableOpacity style={styles.activityAction}>
                    <MessageCircle size={14} color="#6b7280" />
                    <Text style={styles.activityActionText}>Quote</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.activityAction}>
                    <Heart size={14} color="#6b7280" />
                    <Text style={styles.activityActionText}>{activity.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.activityAction}>
                    <Text style={styles.activityActionText}>Report</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    activityCard: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    activityHeader: {
        marginBottom: 8,
    },
    activityTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    activityMeta: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    authorNameLink: {
        color: '#0e7490',
        fontWeight: '500',
    },
    activityBody: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        marginBottom: 12,
    },
    activityActions: {
        flexDirection: 'row',
        gap: 16,
    },
    activityAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    activityActionText: {
        fontSize: 12,
        color: '#6b7280',
    },
});

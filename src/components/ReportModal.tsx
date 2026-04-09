import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { X, Check } from 'lucide-react-native';

const REPORT_REASONS = [
    'Harassment or bullying',
    'Hate speech or discrimination',
    'Spam or Advertising',
    'Misinformation or false information',
    'Impersonation or fake identity',
    'Other'
];

interface ReportModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    isSubmitting?: boolean;
}

export const ReportModal: React.FC<ReportModalProps> = ({ visible, onClose, onSubmit, isSubmitting }) => {
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [otherReasonText, setOtherReasonText] = useState<string>('');

    const handleClose = () => {
        setSelectedReason('');
        setOtherReasonText('');
        onClose();
    };

    const handleSubmit = () => {
        if (!selectedReason) return;
        const finalReason = selectedReason === 'Other' ? otherReasonText.trim() : selectedReason;
        if (!finalReason) return;

        onSubmit(finalReason);
        // Don't reset state here, let the parent handle success/close
    };

    const isSubmitDisabled = !selectedReason || (selectedReason === 'Other' && !otherReasonText.trim()) || isSubmitting;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Report Comment</Text>
                        <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                            <X size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 20 }}>
                        <View style={styles.optionsContainer}>
                            {REPORT_REASONS.map((reason) => {
                                const isSelected = selectedReason === reason;
                                return (
                                    <TouchableOpacity
                                        key={reason}
                                        style={[styles.optionBorder, isSelected && styles.optionBorderSelected]}
                                        onPress={() => setSelectedReason(reason)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                            {isSelected && <Check size={14} color="#fff" />}
                                        </View>
                                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                            {reason}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {selectedReason === 'Other' && (
                            <TextInput
                                style={styles.reportInput}
                                placeholder="Write reason here..."
                                value={otherReasonText}
                                onChangeText={setOtherReasonText}
                                multiline
                                numberOfLines={4}
                                autoFocus
                            />
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={handleClose}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.reportSubmitBtn, isSubmitDisabled && { opacity: 0.5 }]}
                                onPress={handleSubmit}
                                disabled={isSubmitDisabled}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.reportSubmitBtnText}>Report Comment</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '100%',
        maxHeight: '90%',
        maxWidth: 500,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 5,
            },
            web: {
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }
        }),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalBody: {
        paddingHorizontal: 24,
    },
    optionsContainer: {
        gap: 12,
        marginBottom: 20,
    },
    optionBorder: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        borderRadius: 12,
        gap: 16,
    },
    optionBorderSelected: {
        borderColor: '#e5e7eb',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#0e7490',
        borderColor: '#0e7490',
    },
    optionText: {
        fontSize: 15,
        color: '#4b5563',
    },
    optionTextSelected: {
        color: '#111827',
        fontWeight: '500',
    },
    reportInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#111827',
        textAlignVertical: 'top',
        minHeight: 120,
        marginBottom: 20,
        ...Platform.select({
            web: { outlineStyle: 'none' } as any,
        }),
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        color: '#374151',
        fontWeight: 'bold',
        fontSize: 15,
    },
    reportSubmitBtn: {
        flex: 1,
        backgroundColor: '#86b6cd',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reportSubmitBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
});

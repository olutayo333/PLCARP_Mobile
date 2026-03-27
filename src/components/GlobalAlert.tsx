import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, AlertButton } from 'react-native';
import CustomAlert from '../utils/CustomAlert';

export const GlobalAlert = () => {
    const [config, setConfig] = useState<{
        title: string;
        message?: string;
        buttons?: AlertButton[];
    } | null>(null);

    useEffect(() => {
        // Register the listener to intercept all CustomAlert.alert() calls
        CustomAlert.setListener((title, message, buttons) => {
            setConfig({ title, message, buttons });
        });
        
        // Cleanup listener on unmount
        return () => {
            CustomAlert.setListener(() => {});
        };
    }, []);

    if (!config) return null;

    // Use default 'OK' button if none are provided
    const defaultButtons: AlertButton[] = config.buttons && config.buttons.length > 0
        ? config.buttons 
        : [{ text: 'OK' }];

    const handlePress = (btn: AlertButton) => {
        setConfig(null); // Dismiss the modal
        if (btn.onPress) {
            btn.onPress(); // Fire the callback
        }
    };

    return (
        <Modal 
            visible={!!config} 
            transparent 
            animationType="fade" 
            onRequestClose={() => setConfig(null)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>{config.title}</Text>
                    {!!config.message && (
                        <Text style={styles.modalMessage}>{config.message}</Text>
                    )}
                    
                    <View style={styles.modalActions}>
                        {defaultButtons.map((btn, index) => {
                            const isCancel = btn.style === 'cancel';
                            const isDestructive = btn.style === 'destructive';
                            
                            return (
                                <TouchableOpacity 
                                    key={index}
                                    style={[
                                        styles.modalBtn,
                                        isCancel ? styles.modalCancelBtn : styles.modalConfirmBtn,
                                        isDestructive && styles.modalDangerBtn
                                    ]}
                                    onPress={() => handlePress(btn)}
                                >
                                    <Text style={[
                                        styles.modalBtnText,
                                        isCancel ? styles.modalCancelText : styles.modalConfirmText
                                    ]}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 22,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalCancelBtn: {
        backgroundColor: '#f1f5f9',
    },
    modalConfirmBtn: {
        backgroundColor: '#0e7490',
    },
    modalDangerBtn: {
        backgroundColor: '#ef4444',
    },
    modalBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
    modalCancelText: {
        color: '#374151',
    },
    modalConfirmText: {
        color: '#fff',
    },
});

import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { useSendPasswordVerificationCodeMutation, useResetPasswordMutation } from '../services/authApi';
import CustomAlert from '../utils/CustomAlert';

const Alert = CustomAlert;

export function ForgotPasswordScreen({ onBackToLogin }: { onBackToLogin: () => void }) {
    const [step, setStep] = useState<1 | 2>(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    const [sendCodeApi, { isLoading: isSendingCode }] = useSendPasswordVerificationCodeMutation();
    const [resetPasswordApi, { isLoading: isResettingPassword }] = useResetPasswordMutation();

    // Cross-platform modal state
    type ConfirmConfig = { title: string; message: string; confirmText: string; hideCancel?: boolean; danger?: boolean; onConfirm: () => void };
    const [confirmModal, setConfirmModal] = useState<ConfirmConfig | null>(null);

    const showConfirm = (cfg: ConfirmConfig) => setConfirmModal(cfg);
    const dismissConfirm = () => setConfirmModal(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const validateStep1 = () => {
        if (!email) {
            showConfirm({ title: 'Error', message: 'Email address is required', confirmText: 'OK', hideCancel: true, onConfirm: () => {} });
            return false;
        }
        if (!emailRegex.test(email)) {
            showConfirm({ title: 'Error', message: 'Enter a valid email address', confirmText: 'OK', hideCancel: true, onConfirm: () => {} });
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!token) {
            showConfirm({ title: 'Error', message: 'Verification Code is required', confirmText: 'OK', hideCancel: true, onConfirm: () => {} });
            return false;
        }
        if (!password) {
            showConfirm({ title: 'Error', message: 'Password is required', confirmText: 'OK', hideCancel: true, onConfirm: () => {} });
            return false;
        }
        if (!passwordRegex.test(password)) {
            showConfirm({ title: 'Error', message: 'Password must meet minimum requirements (8 chars, uppercase, lowercase, special character)', confirmText: 'OK', hideCancel: true, onConfirm: () => {} });
            return false;
        }
        if (!passwordConfirm) {
            showConfirm({ title: 'Error', message: 'Confirm Password is required', confirmText: 'OK', hideCancel: true, onConfirm: () => {} });
            return false;
        }
        if (password !== passwordConfirm) {
            showConfirm({ title: 'Error', message: 'Passwords do not match', confirmText: 'OK', hideCancel: true, onConfirm: () => {} });
            return false;
        }
        return true;
    };

    const handleSendToken = async () => {
        if (!validateStep1()) return;

        try {
          const response = await sendCodeApi({ email }).unwrap() as any;
          if (response.status) {
            showConfirm({ 
              title: 'Success', 
              message: response?.message || 'Verification code sent to your email.', 
              confirmText: 'Next', 
              hideCancel: true,
              onConfirm: () => setStep(2) 
            });
          } else {
            showConfirm({ title: 'Error', message: response?.message || 'Failed to send reset link.', confirmText: 'OK', hideCancel: true, onConfirm: () => {} });
          }
        } catch (error: any) {
            showConfirm({ title: 'Error', message: error?.data?.message || 'Failed to send reset link.', confirmText: 'Retry', hideCancel: true, onConfirm: () => {} });
        }
    };

    const handleResetPassword = async () => {
        if (!validateStep2()) return;
        try {
            const response = await resetPasswordApi({
                email,
                token,
                password,
            }).unwrap() as any;
            if (response.status) {
                showConfirm({ 
                  title: 'Success', 
                  message: response?.message || 'Password has been reset successfully.', 
                  confirmText: 'Login Now', 
                  hideCancel: true,
                  onConfirm: () => onBackToLogin() 
                });
            } else {
                showConfirm({ title: 'Error', message: response?.message || 'Failed to reset password.', confirmText: 'OK', hideCancel: true, onConfirm: () => {} });
            }
        } catch (error: any) {
            showConfirm({ title: 'Error', message: error?.data?.message || 'Failed to reset password.', confirmText: 'Retry', hideCancel: true, onConfirm: () => {} });
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity style={styles.backButton} onPress={onBackToLogin}>
                    <ArrowLeft size={24} color="#111827" />
                </TouchableOpacity>

                {step === 1 ? (
                    <View style={styles.form}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Forgot password</Text>
                            <Text style={styles.subtitle}>
                                A reset link will be sent to the provided email address.
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email address <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter email"
                                placeholderTextColor="#9ca3af"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, isSendingCode && styles.buttonDisabled]}
                            onPress={handleSendToken}
                            disabled={isSendingCode}
                        >
                            {isSendingCode ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Send reset link</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.form}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Reset password</Text>
                            <Text style={styles.subtitle}>
                                Enter your verification code and confirm new password.
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Verification Code <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter 6-digit code"
                                placeholderTextColor="#9ca3af"
                                value={token}
                                onChangeText={setToken}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>New password <Text style={styles.required}>*</Text></Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Enter password"
                                    placeholderTextColor="#9ca3af"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.hint}>
                                A minimum of 8 characters and must contain at least one Uppercase, lowercase and a special character
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm new password <Text style={styles.required}>*</Text></Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Confirm password"
                                    placeholderTextColor="#9ca3af"
                                    secureTextEntry={!showConfirmPassword}
                                    value={passwordConfirm}
                                    onChangeText={setPasswordConfirm}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    {showConfirmPassword ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, isResettingPassword && styles.buttonDisabled]}
                            onPress={handleResetPassword}
                            disabled={isResettingPassword}
                        >
                            {isResettingPassword ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Reset password</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* ── Cross-Platform CONFIRM Modal ── */}
            <Modal
                visible={!!confirmModal}
                transparent
                animationType="fade"
                onRequestClose={dismissConfirm}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{confirmModal?.title}</Text>
                        <Text style={styles.modalMessage}>{confirmModal?.message}</Text>
                        <View style={styles.modalActions}>
                            {!confirmModal?.hideCancel && (
                                <TouchableOpacity style={styles.modalCancelBtn} onPress={dismissConfirm}>
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.modalConfirmBtn, confirmModal?.danger && styles.modalDangerBtn]}
                                onPress={() => {
                                    dismissConfirm();
                                    confirmModal?.onConfirm();
                                }}
                            >
                                <Text style={styles.modalConfirmText}>{confirmModal?.confirmText}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 24,
        paddingTop: 60,
    },
    backButton: {
        marginBottom: 24,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#4b5563',
        lineHeight: 24,
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        textTransform: 'uppercase',
    },
    required: {
        color: '#ef4444',
    },
    input: {
        height: 56,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#111827',
        ...Platform.select({
            web: {
                outlineStyle: 'none',
            },
        }),
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 16,
    },
    passwordInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    hint: {
        fontSize: 12,
        color: '#6b7280',
        lineHeight: 18,
    },
    button: {
        backgroundColor: '#0e7490',
        height: 56,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Modal Styles
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
    },
    modalMessage: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 22,
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    modalConfirmBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#0e7490',
        alignItems: 'center',
    },
    modalDangerBtn: {
        backgroundColor: '#ef4444',
    },
    modalConfirmText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
});

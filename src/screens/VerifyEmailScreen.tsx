import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mail, RefreshCw } from 'lucide-react-native';
import { useVerifyEmailApiMutation, useResendVerificationCodeMutation } from '../services/authApi';
import { useDispatch } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';

// ─── Props ───────────────────────────────────────────────────────────────────

interface VerifyEmailScreenProps {
    onVerified: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VerifyEmailScreen({ onVerified }: VerifyEmailScreenProps) {
    const dispatch = useDispatch();

    // State
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [loaded, setLoaded] = useState(false);

    // Modal
    type ConfirmConfig = {
        title: string;
        message: string;
        confirmText: string;
        hideCancel?: boolean;
        onConfirm: () => void;
    };
    const [confirmModal, setConfirmModal] = useState<ConfirmConfig | null>(null);
    const showConfirm = (cfg: ConfirmConfig) => setConfirmModal(cfg);
    const dismissConfirm = () => setConfirmModal(null);

    // API hooks
    const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailApiMutation();
    const [resendCode, { isLoading: isResending }] = useResendVerificationCodeMutation();

    // ── Load credentials from AsyncStorage ──────────────────────────────────
    useEffect(() => {
        const loadCredentials = async () => {
            try {
                const storedEmail = await AsyncStorage.getItem('verificationEmail');
                const storedPassword = await AsyncStorage.getItem('verificationPassword');

                if (!storedEmail || !storedPassword) {
                    showConfirm({
                        title: 'Session Expired',
                        message: 'Could not load account details. Please log in again.',
                        confirmText: 'OK',
                        hideCancel: true,
                        onConfirm: () => onVerified(),
                    });
                    return;
                }

                setEmail(storedEmail);
            } finally {
                setLoaded(true);
            }
        };

        loadCredentials();
    }, []);

    // ── Countdown timer ───────────────────────────────────────────────────────
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formattedTime =
        `0${Math.floor(timeLeft / 60)}`.slice(-2) + ':' + `0${timeLeft % 60}`.slice(-2);

    // ── OTP change: digits only, max 6 ───────────────────────────────────────
    const handleOtpChange = (value: string) => {
        const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
        setOtp(digitsOnly);
    };

    // ── Verify ────────────────────────────────────────────────────────────────
    const handleVerify = async () => {
        if (otp.length !== 6) return; // button is disabled, but guard anyway

        try {
            const response = await verifyEmail({ email, otp }).unwrap() as any;

            if (response?.statusCode === 200 || response?.status === true) {
                await AsyncStorage.removeItem('verificationEmail');
                await AsyncStorage.removeItem('verificationPassword');
                dispatch(showToast({ message: 'Email verified! Please log in.', type: 'success' }));
                onVerified();
                return;
            }

            showConfirm({
                title: 'Verification Failed',
                message: response?.message || 'Invalid code. Please try again.',
                confirmText: 'Try Again',
                hideCancel: true,
                onConfirm: () => setOtp(''),
            });
        } catch (error: any) {
            const message: string = error?.data?.message || error?.message || '';

            if (typeof message === 'string' && message.toLowerCase().includes('already verified')) {
                await AsyncStorage.removeItem('verificationEmail');
                await AsyncStorage.removeItem('verificationPassword');
                dispatch(showToast({ message: 'Email already verified. Please log in.', type: 'success' }));
                onVerified();
                return;
            }

            showConfirm({
                title: 'Verification Failed',
                message: message || 'Something went wrong. Please try again.',
                confirmText: 'OK',
                hideCancel: true,
                onConfirm: () => setOtp(''),
            });
        }
    };

    // ── Resend ────────────────────────────────────────────────────────────────
    const handleResend = async () => {
        try {
            const response = await resendCode({ email }).unwrap() as any;
            dispatch(showToast({
                message: response?.message || 'Verification code sent. Check your email.',
                type: 'success',
            }));
            setTimeLeft(60);
            setOtp('');
        } catch (error: any) {
            const message = error?.data?.message || 'Failed to resend code. Please try again.';
            showConfirm({
                title: 'Resend Failed',
                message,
                confirmText: 'OK',
                hideCancel: true,
                onConfirm: () => { },
            });
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (!loaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0e7490" />
            </View>
        );
    }

    const isReady = otp.length === 6;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <Mail size={36} color="#0e7490" />
                </View>

                {/* Heading */}
                <Text style={styles.title}>Check your email</Text>
                <Text style={styles.subtitle}>
                    We sent a 6-digit verification code to{'\n'}
                    <Text style={styles.emailText}>{email}</Text>
                </Text>

                {/* Single OTP Input */}
                <View style={styles.otpWrapper}>
                    <TextInput
                        style={[styles.otpInput, isReady && styles.otpInputReady]}
                        value={otp}
                        onChangeText={handleOtpChange}
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholder="Enter 6-digit code"
                        placeholderTextColor="#9ca3af"
                        textAlign="center"
                        autoCorrect={false}
                        autoComplete="one-time-code"
                        textContentType="oneTimeCode"
                        importantForAutofill="yes"
                    />
                    {/* Character counter */}
                    <Text style={[styles.counter, isReady && styles.counterReady]}>
                        {otp.length} / 6
                    </Text>
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                    style={[styles.button, (!isReady || isVerifying) && styles.buttonDisabled]}
                    onPress={handleVerify}
                    disabled={!isReady || isVerifying}
                    activeOpacity={0.85}
                >
                    {isVerifying ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Verify Account</Text>
                    )}
                </TouchableOpacity>

                {/* Resend */}
                <View style={styles.resendContainer}>
                    {timeLeft > 0 ? (
                        <Text style={styles.resendText}>
                            Didn't receive a code? Request again in{' '}
                            <Text style={styles.timerText}>{formattedTime}</Text>
                        </Text>
                    ) : (
                        <View style={styles.resendRow}>
                            <Text style={styles.resendText}>Didn't receive a code?{'  '}</Text>
                            <TouchableOpacity onPress={handleResend} disabled={isResending}>
                                {isResending ? (
                                    <ActivityIndicator size="small" color="#0e7490" />
                                ) : (
                                    <View style={styles.resendBtn}>
                                        <RefreshCw size={14} color="#0e7490" />
                                        <Text style={styles.resendLink}>Resend Code</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Back to Login */}
                <TouchableOpacity onPress={onVerified} style={styles.backLink}>
                    <Text style={styles.backLinkText}>Back to Login</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* ── Confirm Modal ── */}
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
                                style={styles.modalConfirmBtn}
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

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        paddingTop: 60,
        paddingBottom: 48,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor: '#ecfeff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#a5f3fc',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 36,
    },
    emailText: {
        fontWeight: '700',
        color: '#111827',
    },
    // Single OTP input
    otpWrapper: {
        width: '100%',
        marginBottom: 28,
        gap: 8,
    },
    otpInput: {
        width: '100%',
        height: 64,
        borderWidth: 2,
        borderColor: '#d1d5db',
        borderRadius: 12,
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        backgroundColor: '#f9fafb',
        letterSpacing: 10,
        ...Platform.select({
            web: { outlineStyle: 'none' } as any,
        }),
    },
    otpInputReady: {
        borderColor: '#0e7490',
        backgroundColor: '#ecfeff',
    },
    counter: {
        textAlign: 'right',
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '600',
    },
    counterReady: {
        color: '#0e7490',
    },
    // Button
    button: {
        width: '100%',
        height: 56,
        backgroundColor: '#0e7490',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#0e7490',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Resend
    resendContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    resendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    resendText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
    timerText: {
        fontWeight: 'bold',
        color: '#0e7490',
    },
    resendBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    resendLink: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0e7490',
    },
    backLink: {
        marginTop: 8,
        padding: 8,
    },
    backLinkText: {
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    // Modal
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
    modalConfirmText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
});

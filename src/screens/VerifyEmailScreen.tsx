import React, { useState, useEffect, useCallback } from 'react';
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
    onVerified: () => void; // navigates to Login
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VerifyEmailScreen({ onVerified }: VerifyEmailScreenProps) {
    const dispatch = useDispatch();

    // State
    const [email, setEmail] = useState('');
    const [code, setCode] = useState<string[]>(Array(6).fill(''));
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

    // ── Load credentials from AsyncStorage on mount ──────────────────────────
    useEffect(() => {
        const loadCredentials = async () => {
            try {
                const storedEmail = await AsyncStorage.getItem('verificationEmail');
                const storedPassword = await AsyncStorage.getItem('verificationPassword');

                if (!storedEmail || !storedPassword) {
                    // No credentials – should not be here; go back to Login
                    showConfirm({
                        title: 'Access Denied',
                        message: 'Session expired. Please log in again.',
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
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formattedTime =
        `0${Math.floor(timeLeft / 60)}`.slice(-2) + ':' + `0${timeLeft % 60}`.slice(-2);

    // ── OTP input handlers ────────────────────────────────────────────────────
    const inputs = React.useRef<(TextInput | null)[]>([]);

    const handleCodeChange = (value: string, index: number) => {
        // Accept only digits
        const digit = value.replace(/\D/g, '').slice(-1);
        const newCode = [...code];
        newCode[index] = digit;
        setCode(newCode);

        // Auto-advance
        if (digit && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace') {
            if (code[index]) {
                const newCode = [...code];
                newCode[index] = '';
                setCode(newCode);
            } else if (index > 0) {
                const newCode = [...code];
                newCode[index - 1] = '';
                setCode(newCode);
                inputs.current[index - 1]?.focus();
            }
        }
    };

    // ── Verify ────────────────────────────────────────────────────────────────
    const handleVerify = async () => {
        const otp = code.join('');
        if (otp.length !== 6) {
            showConfirm({
                title: 'Incomplete Code',
                message: 'Please enter the full 6-digit verification code.',
                confirmText: 'OK',
                hideCancel: true,
                onConfirm: () => { },
            });
            return;
        }

        try {
            const response = await verifyEmail({ email, otp }).unwrap() as any;

            if (response?.statusCode === 200 || response?.status === true) {
                await AsyncStorage.removeItem('verificationEmail');
                await AsyncStorage.removeItem('verificationPassword');
                dispatch(showToast({ message: 'Email verified successfully! Please log in.', type: 'success' }));
                onVerified();
                return;
            }

            showConfirm({
                title: 'Verification Failed',
                message: response?.message || 'Invalid code. Please try again.',
                confirmText: 'Try Again',
                hideCancel: true,
                onConfirm: () => { },
            });
        } catch (error: any) {
            const message: string = error?.data?.message || error?.message || '';

            // Handle already-verified case gracefully
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
                onConfirm: () => { },
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
            setCode(Array(6).fill(''));
            inputs.current[0]?.focus();
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

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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

                {/* OTP Boxes */}
                <View style={styles.otpContainer}>
                    {Array.from({ length: 6 }).map((_, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputs.current[index] = ref; }}
                            style={[
                                styles.otpBox,
                                code[index] ? styles.otpBoxFilled : {},
                            ]}
                            value={code[index]}
                            onChangeText={(value) => handleCodeChange(value, index)}
                            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            textAlign="center"
                            selectTextOnFocus
                            caretHidden={Platform.OS !== 'web'}
                        />
                    ))}
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                    style={[styles.button, isVerifying && styles.buttonDisabled]}
                    onPress={handleVerify}
                    disabled={isVerifying}
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

            {/* ── Confirm Modal ────────────────────────────────────── */}
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
    otpContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 32,
    },
    otpBox: {
        width: 48,
        height: 56,
        borderWidth: 1.5,
        borderColor: '#d1d5db',
        borderRadius: 10,
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        backgroundColor: '#f9fafb',
        ...Platform.select({
            web: { outlineStyle: 'none' } as any,
        }),
    },
    otpBoxFilled: {
        borderColor: '#0e7490',
        backgroundColor: '#ecfeff',
    },
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
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
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

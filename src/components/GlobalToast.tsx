import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    View,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { hideToast } from '../store/slices/uiSlice';
import { CheckCircle2, AlertCircle, Info as InfoIcon, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function GlobalToast() {
    const { visible, message, type } = useSelector((state: RootState) => state.ui.toast);
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            // Slide in
            Animated.spring(translateY, {
                toValue: insets.top + 16,
                useNativeDriver: true,
                friction: 8,
                tension: 40,
            }).start();

            // Auto hide after 3 seconds
            const timer = setTimeout(() => {
                handleHide();
            }, 3000);

            return () => clearTimeout(timer);
        } else {
            // Slide out
            Animated.timing(translateY, {
                toValue: -150,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, insets.top]);

    const handleHide = () => {
        Animated.timing(translateY, {
            toValue: -150,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            dispatch(hideToast());
        });
    };

    if (!visible && (translateY as any).__getValue() === -150) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 size={20} color="#22c55e" />;
            case 'error': return <AlertCircle size={20} color="#ef4444" />;
            default: return <InfoIcon size={20} color="#3b82f6" />;
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case 'success': return '#bbf7d0';
            case 'error': return '#fecaca';
            default: return '#bfdbfe';
        }
    };

    return (
        <Animated.View style={[
            styles.container,
            { 
                transform: [{ translateY }],
                borderColor: getBorderColor(),
            }
        ]}>
            <View style={styles.content}>
                {getIcon()}
                <Text style={styles.message}>{message}</Text>
                <TouchableOpacity onPress={handleHide} style={styles.closeBtn}>
                    <X size={16} color="#9ca3af" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        right: 16,
        left: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        zIndex: 9999,
        // Elevation for Android
        elevation: 10,
        // Shadow for iOS/Web
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        maxWidth: Platform.OS === 'web' ? 400 : '100%',
        alignSelf: Platform.OS === 'web' ? 'flex-end' : 'stretch',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    message: {
        flex: 1,
        fontSize: 14,
        color: '#1f2937',
        fontWeight: '500',
    },
    closeBtn: {
        padding: 4,
    },
});

import { AlertButton, AlertOptions } from 'react-native';

export type AlertListener = (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
) => void;

class CustomAlert {
    static listener: AlertListener | null = null;

    static setListener(listener: AlertListener) {
        this.listener = listener;
    }

    static alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) {
        if (this.listener) {
            this.listener(title, message, buttons, options);
        } else {
            // Fallback to native just in case it's called before the UI mounts
            import('react-native').then(({ Alert }) => {
                Alert.alert(title, message, buttons, options);
            });
        }
    }

    // Polyfill for Alert.prompt (currently passes through to native, which silently fails on Web but works natively)
    static prompt(
        title: string,
        message?: string,
        callbackOrButtons?: ((text: string) => void) | AlertButton[],
        type?: 'default' | 'plain-text' | 'secure-text' | 'login-password',
        defaultValue?: string,
        keyboardType?: string
    ) {
        import('react-native').then(({ Alert }) => {
            if (Alert.prompt) {
                Alert.prompt(title, message, callbackOrButtons, type, defaultValue, keyboardType);
            }
        });
    }
}

export default CustomAlert;

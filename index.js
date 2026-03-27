// IMPORTANT: gesture-handler MUST be the very first import
import 'react-native-gesture-handler';

import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';

// Enable native screens before mounting the component tree
enableScreens(true);

import App from './src/App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App)
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

import * as ReactNativeWeb from 'react-native-web';

export const TurboModuleRegistry = {
  get: () => null,
};

const mockEventEmitter = {
  addListener: () => ({ remove: () => {} }),
  removeListeners: () => {},
  removeAllListeners: () => {},
  emit: () => {},
};

// Recursive Proxy to handle any depth of NativeModules access
const createRecursiveMock = (name: string): any => {
  const mock: any = {
    EventEmitter: mockEventEmitter,
    State: {
      BEGAN: 1,
      FAILED: 2,
      BEGAN_OR_FAILED: 3,
      CANCELLED: 4,
      ACTIVE: 5,
      END: 6,
    },
    attachGestureHandler: () => {},
    createGestureHandler: () => {},
    dropGestureHandler: () => {},
    updateGestureHandler: () => {},
    addListener: () => ({ remove: () => {} }),
    removeListeners: () => {},
    // Add other common methods as needed
  };

  return new Proxy(mock, {
    get: (target: any, prop: string) => {
      if (prop in target) return target[prop];
      return createRecursiveMock(prop);
    }
  });
};

const _NativeModules = ReactNativeWeb.NativeModules || {};
export const NativeModules = new Proxy(_NativeModules, {
  get: (target: any, prop: string) => {
    if (prop in target) return target[prop];
    return createRecursiveMock(prop);
  }
});

export const NativeEventEmitter = class {
  addListener() { return { remove: () => {} }; }
  removeAllListeners() {}
  removeSubscription() {}
};

export const DeviceEventEmitter = ReactNativeWeb.DeviceEventEmitter || mockEventEmitter;

// Some libraries expect EventEmitter to be exported directly
export const EventEmitter = mockEventEmitter;

export const customDirectEventTypes = {};

export const PressabilityDebugView = () => null;

export const DrawerLayoutAndroid = () => null;
export const RefreshControl = () => null;

export const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
};

if (typeof window !== 'undefined') {
  (window as any).NativeModules = NativeModules;
}

const ReactNativeMock: any = () => {
  return (props: any) => null;
};

Object.assign(ReactNativeMock, ReactNativeWeb, {
  NativeModules,
  NativeEventEmitter,
  DeviceEventEmitter,
  EventEmitter,
  TurboModuleRegistry,
});

export default ReactNativeMock;

export * from 'react-native-web';

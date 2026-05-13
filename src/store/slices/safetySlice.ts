import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLOCKED_USERS_KEY = '@plrcap_blocked_users';

interface SafetyState {
    blockedUserIds: string[];
    isInitialized: boolean;
}

const initialState: SafetyState = {
    blockedUserIds: [],
    isInitialized: false,
};

// Async thunk to load blocked users from persistent storage
export const loadBlockedUsers = createAsyncThunk(
    'safety/loadBlockedUsers',
    async () => {
        try {
            const stored = await AsyncStorage.getItem(BLOCKED_USERS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load blocked users:', error);
            return [];
        }
    }
);

const safetySlice = createSlice({
    name: 'safety',
    initialState,
    reducers: {
        blockUser: (state, action: PayloadAction<string>) => {
            const userId = action.payload;
            if (!state.blockedUserIds.includes(userId)) {
                state.blockedUserIds.push(userId);
                // Sync to storage (fire and forget)
                AsyncStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(state.blockedUserIds));
            }
        },
        unblockUser: (state, action: PayloadAction<string>) => {
            state.blockedUserIds = state.blockedUserIds.filter(id => id !== action.payload);
            // Sync to storage
            AsyncStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(state.blockedUserIds));
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loadBlockedUsers.fulfilled, (state, action) => {
            state.blockedUserIds = action.payload;
            state.isInitialized = true;
        });
    },
});

export const { blockUser, unblockUser } = safetySlice.actions;
export default safetySlice.reducer;

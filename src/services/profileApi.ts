import { REQUEST_METHODS } from '../constants/reqMethods';
import { apiSlice } from './apiSlice';
import axiosInstance from './axiosClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HttpSuccessResponse } from '../types/api';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://plrcap-backend.ambitiousground-313553a9.westeurope.azurecontainerapps.io/api/v1'
//'https://pluralcode-api.onrender.com/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shared base profile (both Expert and NGO_MEMBER) */
export interface UpdateUserProfilePayload {
    fullName?: string;
    phoneNumber?: string;
}

/** Expert-specific profile fields */
export interface UpdateExpertProfilePayload {
    title?: string;
    phoneNumber?: string;
    yearsOfExperience?: number;
    about?: string;
    employer?: string;
    otherExperience?: string;
    mentoringPhilosophy?: string;
    previousMentoringExperience?: string;
    capacityOfMentees?: string;
    education?: {
        title: string;
        certification: string;
        institution: string;
        year: number;
    }[];
    areasOfExpertise?: string[];
    servicesOffered?: string[];
    referees?: {
        name: string;
        email: string;
        phone: string;
        organization: string;
    }[];
    preferredContactMethods?: string[];
    socials?: { [key: string]: string }[];
    otherLinks?: { [key: string]: string }[];
}

/** Organisation (NGO) profile fields */
export interface UpdateOrgProfilePayload {
    name?: string;
    acronym?: string;
    description?: string;
    sector?: string;
    state?: string;
    website?: string;
    email?: string;
    phone?: string;
    phoneNumber?: string;
    founded?: string;
    staff?: string;
    staffCount?: number;
    volunteersCount?: number;
    annualBudget?: number;
    cacNumber?: string;
    address?: string;
    mission?: string;
    vision?: string;
    twitter?: string;
    facebook?: string;
    linkedIn?: string;
}

/** Query params for the public experts directory */
export interface ExpertsQuery {
    page?: number;
    limit?: number;
    search?: string;
    state?: string;
    specialty?: string;
}

export interface UserProfile {
    id: string;
    fullName: string;
    email: string;
    role: string;
    phoneNumber?: string;
    avatarUrl?: string;
    pointsCount: number;
    likesReceived: number;
    createdAt: string;
    expertProfile?: any;
    organization?: any;
    metrics?: {
        likesReceived: number;
        pointsCount: number;
    };
}

// ─── Profile API Slice ────────────────────────────────────────────────────────

export const profileApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({

        // ── Shared User Profile ────────────────────────────────────────────────

        /** GET /users/profile
         *  Get the current authenticated user's profile (includes org or expertProfile).
         *  Used by: expert/profile, ngo/profile
         */
        getUserProfile: builder.query<UserProfile, void>({
            query: () => ({
                url: `/users/profile`,
                method: REQUEST_METHODS.GET,
            }),
            transformResponse: (response: HttpSuccessResponse<UserProfile>) => response?.data,
            providesTags: ['UserProfile'],
        }),

        /** PATCH /users/profile
         *  Update basic profile fields (fullName, phoneNumber).
         *  Used by: expert/profile, ngo/profile
         */
        updateUserProfile: builder.mutation({
            query: (body: UpdateUserProfilePayload) => ({
                url: `/users/profile`,
                method: REQUEST_METHODS.PATCH,
                body,
            }),
            invalidatesTags: ['UserProfile'],
        }),

        // ── Expert Profile ─────────────────────────────────────────────────────

        /** GET /users/profile/expert
         *  Get the current user's own expert profile (EXPERT role only).
         *  Used by: expert/profile
         */
        getExpertProfile: builder.query<any, void>({
            query: () => ({
                url: `/users/profile/expert`,
                method: REQUEST_METHODS.GET,
            }),
            transformResponse: (response: HttpSuccessResponse<any>) => response?.data,
            providesTags: ['ExpertProfile'],
        }),

        /** PATCH /users/profile/expert
         *  Create or update the expert profile (EXPERT role only).
         *  Used by: expert/profile
         */
        updateExpertProfile: builder.mutation({
            query: (body: UpdateExpertProfilePayload) => ({
                url: `/users/profile/expert`,
                method: REQUEST_METHODS.PATCH,
                body,
            }),
            invalidatesTags: ['ExpertProfile', 'UserProfile'],
        }),

        // ── Experts Directory (public) ─────────────────────────────────────────

        /** GET /users/experts
         *  Browse the public experts directory.
         *  Used by: expert/directory, ngo/directory, guest/directory, (pages)/directory
         */
        getExperts: builder.query({
            query: ({ page, limit, search, state, specialty }: ExpertsQuery = {}) => {
                const params = new URLSearchParams();
                if (page) params.append('page', String(page));
                if (limit) params.append('limit', String(limit));
                if (search) params.append('search', search);
                if (state) params.append('state', state);
                if (specialty) params.append('specialty', specialty);
                const qs = params.toString();
                return { url: `/users/experts${qs ? `?${qs}` : ''}`, method: REQUEST_METHODS.GET };
            },
            transformResponse: (response: HttpSuccessResponse<any>) => response?.data,
            providesTags: ['ExpertProfile'],
        }),

        /** GET /users/experts/{userId}
         *  Get a specific expert's profile by user ID (public).
         *  Used by: (pages)/directory/expert-directory/[id]
         */
        getExpertById: builder.query({
            query: (userId: string) => ({
                url: `/users/experts/${userId}`,
                method: REQUEST_METHODS.GET,
            }),
            transformResponse: (response: HttpSuccessResponse<any>) => response?.data,
            providesTags: (_result, _error, userId) => [{ type: 'ExpertProfile' as const, id: userId }],
        }),

        // ── Organisation Profile ───────────────────────────────────────────────

        /** GET /users/profile/organization
         *  Get the organisation owned by the current NGO user (full detail).
         *  Used by: ngo/profile
         */
        getOrgProfile: builder.query<any, void>({
            query: () => ({
                url: `/users/profile/organization`,
                method: REQUEST_METHODS.GET,
            }),
            transformResponse: (response: HttpSuccessResponse<any>) => response?.data,
            providesTags: ['OrgProfile'],
        }),

        /** PATCH /users/profile/organization
         *  Update organisation details (NGO_MEMBER only).
         *  Used by: ngo/profile
         */
        updateOrgProfile: builder.mutation({
            query: (body: UpdateOrgProfilePayload) => ({
                url: `/users/profile/organization`,
                method: REQUEST_METHODS.PATCH,
                body,
            }),
            invalidatesTags: ['OrgProfile', 'UserProfile'],
        }),

        /** DELETE /users/profile
         *  Permanently delete the current user's account and all associated data.
         *  Strictly required by App/Play Store policies.
         */
        deleteAccount: builder.mutation<{ status: boolean; message: string }, void>({
            query: () => ({
                url: `/users/delete`,
                method: REQUEST_METHODS.DELETE,
            }),
            invalidatesTags: ['UserProfile'],
        }),

    }),
});

export const {
    // Shared
    useGetUserProfileQuery,
    useUpdateUserProfileMutation,
    // Expert profile
    useGetExpertProfileQuery,
    useUpdateExpertProfileMutation,
    // Experts directory
    useGetExpertsQuery,
    useGetExpertByIdQuery,
    // Organisation profile
    useGetOrgProfileQuery,
    useUpdateOrgProfileMutation,
    // Account deletion
    useDeleteAccountMutation,
} = profileApiSlice;

// ─── Axios — File Uploads ─────────────────────────────────────────────────────
// These use axios (not RTK Query) because they send multipart/form-data.

/** POST /users/profile/avatar
 *  Upload a profile avatar (max 2 MB, JPEG/PNG/WebP).
 *  Used by: expert/profile
 *  @param formData  FormData with key "file" → File
 */
export const uploadAvatarApi = async (formData: FormData) => {
    // Use native fetch (NOT axios) for FormData uploads.
    // Axios sets Content-Type: application/x-www-form-urlencoded by default on
    // React Native, which crashes the native OkHttp multipart body builder.
    // Native fetch automatically sets: multipart/form-data; boundary=xxxx
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/users/profile/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw { response: { data: error } };
    }
    return response.json();
};

/** POST /users/profile/organization/logo
 *  Upload an organisation logo (max 2 MB, JPEG/PNG/WebP/SVG).
 *  Used by: ngo/profile
 *  @param formData  FormData with key "logo" → File
 */
export const uploadOrgLogoApi = async (formData: FormData) => {
    // Use native fetch (NOT axios) for FormData uploads. Same reason as above.
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/users/profile/organization/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw { response: { data: error } };
    }
    return response.json();
};

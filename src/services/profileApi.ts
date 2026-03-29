import { REQUEST_METHODS } from '../constants/reqMethods';
import { apiSlice } from './apiSlice';
import axiosInstance from './axiosClient';
import { HttpSuccessResponse } from '../types/api';

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

// ─── Profile API Slice ────────────────────────────────────────────────────────

export const profileApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({

        // ── Shared User Profile ────────────────────────────────────────────────

        /** GET /users/profile
         *  Get the current authenticated user's profile (includes org or expertProfile).
         *  Used by: expert/profile, ngo/profile
         */
        getUserProfile: builder.query<any, void>({
            query: () => ({
                url: `/users/profile`,
                method: REQUEST_METHODS.GET,
            }),
            transformResponse: (response: HttpSuccessResponse<any>) => response?.data,
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
} = profileApiSlice;

// ─── Axios — File Uploads ─────────────────────────────────────────────────────
// These use axios (not RTK Query) because they send multipart/form-data.

/** POST /users/profile/avatar
 *  Upload a profile avatar (max 2 MB, JPEG/PNG/WebP).
 *  Used by: expert/profile
 *  @param formData  FormData with key "file" → File
 */
export const uploadAvatarApi = async (formData: FormData) => {
    const response = await axiosInstance.post('/users/profile/avatar', formData);
    return response;
};

/** POST /users/profile/organization/logo
 *  Upload an organisation logo (max 2 MB, JPEG/PNG/WebP/SVG).
 *  Used by: ngo/profile
 *  @param formData  FormData with key "logo" → File
 */
export const uploadOrgLogoApi = async (formData: FormData) => {
    const response = await axiosInstance.post('/users/profile/organization/logo', formData);
    return response;
};

import {apiSlice} from './apiSlice';

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    signup: builder.mutation<{status: boolean; message: string; data: any}, {email: string; password: string}>({
      query: (credentials) => ({
        url: '/users/signup',
        method: 'POST',
        body: credentials,
      }),
    }),

    login: builder.mutation({
      query: (credentials) => ({
        url: '/users/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    verifyEmailApi: builder.mutation({
      query: (data) => ({
        url: `/users/verify-email`,
        method: 'POST',
        body: data,
      }),
    }),

    sendPasswordVerificationCode: builder.mutation({
      query: (data) => ({
        url: '/users/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),

    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/users/reset-password',
        method: 'POST',
        body: data,
      }),
    }),

    resendVerificationCode: builder.mutation({
      query: (data) => ({
        url: '/users/resend-otp',
        method: 'POST',
        body: data,
      }),
    }),

    logout: builder.mutation<{status: boolean; message: string}, void>({
      query: () => ({
        url: '/logout',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useVerifyEmailApiMutation,
  useSendPasswordVerificationCodeMutation,
  useResetPasswordMutation,
  useResendVerificationCodeMutation,
  useLogoutMutation,
} = authApiSlice;

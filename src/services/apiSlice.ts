import {BaseQueryFn, FetchArgs, createApi, fetchBaseQuery, FetchBaseQueryError} from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://pluralcode-api.onrender.com/api/v1';

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: async (headers) => {
    const token = await AsyncStorage.getItem('token');
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQueryWithAuth(args, api, extraOptions);

  // Check if we receive a 401
  if (result.error && 'status' in result.error && result.error.status === 401) {
    await AsyncStorage.clear();
    // In a real app, you'd trigger a logout action or navigate to login
    // For this prototype, we'll let the UI handle the state change
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  keepUnusedDataFor: 30,
  tagTypes: [
    'Experts',
    'Dashboard',
    'SuperAdminUsers',
    'AdminPermissions',
    'AuditLogs',
    'SuperAdminStats',
    'UserProfile',
    'ExpertProfile',
    'OrgProfile',
    'Organizations',
    'OrgMemberships',
    'OrgMembers',
    'OrgActivities',
    'OrgDonors',
    'ResourceCategories',
    'ResourceTags',
    'ResourceBadges',
    'OdaStructure',
    'OdaSummary',
    'OdaPillars',
    'OdaAssessments',
    'Communities',
    'DevPlan',
    'MentorRequests',
    'Events',
    'Spotlight',
    'SpotlightSettings',
    'SpotlightQueue',
    'SpotlightHistory',
  ],
  endpoints: () => ({}),
});

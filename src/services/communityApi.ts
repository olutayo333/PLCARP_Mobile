import { REQUEST_METHODS } from '../constants/reqMethods';
import { apiSlice } from './apiSlice';
import { HttpSuccessResponse, ApiResponse } from '../types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  coverImageUrl: string;
  memberCount: number;
  topicCount: number;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunitySearchResult {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  createdById: string;
  createdBy: {
    id: string;
    fullName: string;
    avatarUrl: string;
  };
  memberCount: number;
  topicCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedCommunities {
  communities: CommunitySearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  pages: number;
}

export interface TopicAuthor {
  id: string;
  fullName: string;
  avatarUrl: string;
  organization?: {
    id: string;
    name: string;
    acronym?: string;
  };
}

export interface TopicComment {
  id: string;
  body: string;
  likeCount: number;
  hasLiked?: boolean;
  author: TopicAuthor;
  parentId?: string | null;
  replies?: TopicComment[];
  mentionedUserId?: string;
  mentionedUserIds?: string[];
  createdAt: string;
}

export interface CommunityTopicDetail {
  id: string;
  title: string;
  body: string;
  isBlocked: boolean;
  likeCount: number;
  communityId: string;
  author: TopicAuthor;
  comments: TopicComment[];
  hasLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicDto {
  title: string;
  body: string;
}

export interface UpdateTopicDto {
  title?: string;
  body?: string;
}

export interface ReportTopicDto {
  reason: string;
}

export interface AddCommentDto {
  body: string;
  parentId?: string;
  mentionedUserIds?: string[];
}

export interface CommunityMember {
  id: string;
  fullName: string;
  avatarUrl: string;
}

export interface UpdateCommentDto {
  body: string;
}

export interface TopicLikeResponse {
  hasLiked: boolean;
  likeCount: number;
}

export interface CommentLikeResponse extends TopicLikeResponse { }

export interface TopicFilters {
  search?: string;
  filter?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTopics {
  topics: CommunityTopicDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  pages: number;
}

export interface CommunityTopic {
  id: string;
  title: string;
  content: string;
  authorId: string;
  communityId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMention {
  id: string;
  topicId: string;
  topic?: CommunityTopic;
  commentId: string;
  comment?: any;
  createdAt: string;
  communityId: string;
}

export interface OrganizationActivity {
  id: string;
  organizationId: string;
  sector: string;
  who: string;
  where: string;
  when: number;
  activity: string;
  organization?: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  author?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ActivityFilters {
  sector?: string;
  when?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedActivities {
  activities: OrganizationActivity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  pages: number;
}

export interface CommunityAnalytics {
  totalCommunities: number;
  myJoinedCommunities: number;
  totalMembers: number;
  totalTopics: number;
  myTopicsCount: number;
  myRepliesPosted: number;
  myRepliesReceived: number;
}

export interface PerCommunityAnalytics {
  totalMembers: number;
  totalTopics: number;
  onlineMembers: number | null;
  dateJoined: string;
}

// ─── API Slice ────────────────────────────────────────────────────────────────

export const communityApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMySubscriptions: builder.query<Community[], void>({
      query: () => ({
        url: '/communities/my-subscriptions',
        method: REQUEST_METHODS.GET,
      }),
      transformResponse: (response: HttpSuccessResponse<any[]>) => {
        return (response.data || []).map((sub: any) => sub.community) || [];
      },
      providesTags: ['Communities'],
    }),

    getMentions: builder.query<CommunityMention[], void>({
      query: () => ({
        url: '/communities/mentions',
        method: REQUEST_METHODS.GET,
      }),
      transformResponse: (response: HttpSuccessResponse<CommunityMention[]>) => {
        return response.data || [];
      },
      providesTags: ['Communities'],
    }),

    getGeneralAnalytics: builder.query<CommunityAnalytics, void>({
      query: () => ({
        url: '/communities/analytics/general',
        method: REQUEST_METHODS.GET,
      }),
      transformResponse: (response: HttpSuccessResponse<CommunityAnalytics>) => {
        return response.data;
      },
      providesTags: ['Communities'],
    }),

    getCommunities: builder.query<PaginatedCommunities, CommunityFilters>({
      query: (filters = {}) => {
        const { search, page, limit } = filters;
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (page) params.append('page', String(page));
        if (limit) params.append('limit', String(limit));

        const qs = params.toString();
        return {
          url: `/communities${qs ? `?${qs}` : ''}`,
          method: REQUEST_METHODS.GET,
        };
      },
      transformResponse: (response: HttpSuccessResponse<PaginatedCommunities>) => {
        return response.data;
      },
      providesTags: ['Communities'],
    }),

    getCommunityById: builder.query<CommunitySearchResult, string>({
      query: (communityId) => ({
        url: `/communities/${communityId}`,
        method: REQUEST_METHODS.GET,
      }),
      transformResponse: (response: HttpSuccessResponse<CommunitySearchResult>) => {
        return response.data;
      },
      providesTags: (result, error, id) => [{ type: 'Communities', id }],
    }),

    subscribeToCommunity: builder.mutation<any, string>({
      query: (communityId) => ({
        url: `/communities/${communityId}/subscribe`,
        method: REQUEST_METHODS.POST,
      }),
      invalidatesTags: ['Communities'],
    }),

    unsubscribeFromCommunity: builder.mutation<any, string>({
      query: (communityId) => ({
        url: `/communities/${communityId}/unsubscribe`,
        method: REQUEST_METHODS.DELETE,
      }),
      invalidatesTags: ['Communities'],
    }),

    getCommunityAnalytics: builder.query<PerCommunityAnalytics, string>({
      query: (communityId) => ({
        url: `/communities/${communityId}/analytics`,
        method: REQUEST_METHODS.GET,
      }),
      transformResponse: (response: HttpSuccessResponse<PerCommunityAnalytics>) => {
        return response.data;
      },
      providesTags: (result, error, id) => [{ type: 'Communities', id }],
    }),

    getCommunityTopics: builder.query<PaginatedTopics, { communityId: string; filters?: TopicFilters }>({
      query: ({ communityId, filters = {} }) => {
        const { search, page, limit, filter } = filters;
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (filter) params.append('filter', filter);
        if (page) params.append('page', String(page));
        if (limit) params.append('limit', String(limit));

        const qs = params.toString();
        return {
          url: `/communities/${communityId}/topics${qs ? `?${qs}` : ''}`,
          method: REQUEST_METHODS.GET,
        };
      },
      transformResponse: (response: HttpSuccessResponse<PaginatedTopics>) => {
        return response.data;
      },
      providesTags: (result, error, { communityId }) => [
        { type: 'Communities', id: `TOPICS_${communityId}` },
      ],
    }),

    getGlobalTopics: builder.query<PaginatedTopics, TopicFilters>({
      query: (filters = {}) => {
        const { search, page, limit, filter } = filters;
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (filter) params.append('filter', filter);
        if (page) params.append('page', String(page));
        if (limit) params.append('limit', String(limit));

        const qs = params.toString();
        return {
          url: `/communities/topics/all/global${qs ? `?${qs}` : ''}`,
          method: REQUEST_METHODS.GET,
        };
      },
      transformResponse: (response: HttpSuccessResponse<PaginatedTopics>) => {
        return response.data;
      },
      providesTags: ['Communities', { type: 'Communities', id: 'GLOBAL_TOPICS' }],
    }),

    createCommunityTopic: builder.mutation<ApiResponse<CommunityTopic>, { communityId: string; data: CreateTopicDto }>({
      query: ({ communityId, data }) => ({
        url: `/communities/${communityId}/topics`,
        method: REQUEST_METHODS.POST,
        body: data,
      }),
      transformResponse: (response: ApiResponse<CommunityTopic>) => {
        return response;
      },
      invalidatesTags: (result, error, { communityId }) => [
        { type: 'Communities', id: `TOPICS_${communityId}` },
        { type: 'Communities', id: 'GLOBAL_TOPICS' },
      ],
    }),

    getTopicById: builder.query<CommunityTopicDetail, { communityId: string; topicId: string }>({
      query: ({ communityId, topicId }) => ({
        url: `/communities/${communityId}/topics/${topicId}`,
        method: REQUEST_METHODS.GET,
      }),
      transformResponse: (response: HttpSuccessResponse<CommunityTopicDetail>) => {
        return response.data;
      },
      providesTags: (result, error, { topicId }) => [
        { type: 'Communities', id: `TOPIC_${topicId}` },
      ],
    }),

    updateTopic: builder.mutation({
      query: ({ communityId, topicId, data }) => ({
        url: `/communities/${communityId}/topics/${topicId}`,
        method: REQUEST_METHODS.PATCH,
        body: data,
      }),
      transformResponse: (response: any) => {
        return response;
      },
      invalidatesTags: (result, error, { communityId, topicId }) => [
        { type: 'Communities', id: `TOPIC_${topicId}` },
        { type: 'Communities', id: `TOPICS_${communityId}` },
        { type: 'Communities', id: 'GLOBAL_TOPICS' },
      ],
    }),

    reportTopic: builder.mutation<ApiResponse<any>, { communityId: string; topicId: string; data: ReportTopicDto }>({
      query: ({ communityId, topicId, data }) => ({
        url: `/communities/${communityId}/topics/${topicId}/report`,
        method: REQUEST_METHODS.POST,
        body: data,
      }),
      transformResponse: (response: ApiResponse<any>) => response,
    }),

    toggleTopicLike: builder.mutation<ApiResponse<TopicLikeResponse>, { communityId: string; topicId: string }>({
      query: ({ communityId, topicId }) => ({
        url: `/communities/${communityId}/topics/${topicId}/like`,
        method: REQUEST_METHODS.POST,
      }),
      transformResponse: (response: ApiResponse<TopicLikeResponse>) => {
        return response;
      },
      invalidatesTags: (result, error, { communityId, topicId }) => [
        { type: 'Communities', id: `TOPIC_${topicId}` },
        { type: 'Communities', id: `TOPICS_${communityId}` },
        { type: 'Communities', id: 'GLOBAL_TOPICS' },
      ],
    }),

    addComment: builder.mutation<ApiResponse<TopicComment>, { communityId: string; topicId: string; data: AddCommentDto }>({
      query: ({ communityId, topicId, data }) => ({
        url: `/communities/${communityId}/topics/${topicId}/comments`,
        method: REQUEST_METHODS.POST,
        body: data,
      }),
      transformResponse: (response: ApiResponse<TopicComment>) => {
        return response;
      },
      invalidatesTags: (result, error, { topicId }) => [
        { type: 'Communities', id: `TOPIC_${topicId}` },
        { type: 'Communities', id: 'GLOBAL_TOPICS' },
      ],
    }),

    toggleCommentLike: builder.mutation<ApiResponse<CommentLikeResponse>, { communityId: string; topicId: string; commentId: string }>({
      query: ({ communityId, topicId, commentId }) => ({
        url: `/communities/${communityId}/topics/${topicId}/comments/${commentId}/like`,
        method: REQUEST_METHODS.POST,
      }),
      transformResponse: (response: ApiResponse<CommentLikeResponse>) => {
        return response;
      },
      invalidatesTags: (result, error, { topicId }) => [
        { type: 'Communities', id: `TOPIC_${topicId}` },
        { type: 'Communities', id: 'GLOBAL_TOPICS' },
      ],
    }),

    updateComment: builder.mutation({
      query: ({ communityId, topicId, commentId, data }) => ({
        url: `/communities/${communityId}/topics/${topicId}/comments/${commentId}`,
        method: REQUEST_METHODS.PATCH,
        body: data,
      }),
      transformResponse: (response: any) => {
        return response;
      },
      invalidatesTags: (result, error, { topicId }) => [
        { type: 'Communities', id: `TOPIC_${topicId}` },
        { type: 'Communities', id: 'GLOBAL_TOPICS' },
      ],
    }),

    deleteComment: builder.mutation<void, { communityId: string; topicId: string; commentId: string }>({
      query: ({ communityId, topicId, commentId }) => ({
        url: `/communities/${communityId}/topics/${topicId}/comments/${commentId}`,
        method: REQUEST_METHODS.DELETE,
      }),
      invalidatesTags: (result, error, { topicId }) => [
        { type: 'Communities', id: `TOPIC_${topicId}` },
        { type: 'Communities', id: 'GLOBAL_TOPICS' },
      ],
    }),

    deleteTopic: builder.mutation<ApiResponse<any>, { communityId: string; topicId: string }>({
      query: ({ communityId, topicId }) => ({
        url: `/communities/${communityId}/topics/${topicId}`,
        method: REQUEST_METHODS.DELETE,
      }),
      invalidatesTags: (result, error, { communityId, topicId }) => [
        { type: 'Communities', id: `TOPIC_${topicId}` },
        { type: 'Communities', id: `TOPICS_${communityId}` },
        { type: 'Communities', id: 'GLOBAL_TOPICS' },
      ],
    }),

    searchCommunityMembers: builder.query<CommunityMember[], { communityId: string; query: string }>({
      query: ({ communityId, query }) => ({
        url: `/communities/${communityId}/members/search?q=${query}`,
        method: REQUEST_METHODS.GET,
      }),
      transformResponse: (response: HttpSuccessResponse<CommunityMember[]>) => {
        return response.data || [];
      },
    }),

    getOrganizationActivities: builder.query<PaginatedActivities, ActivityFilters>({
      query: (filters = {}) => {
        const { sector, when, search, page, limit } = filters;
        const params = new URLSearchParams();
        if (sector) params.append('sector', sector);
        if (when) params.append('when', String(when));
        if (search) params.append('search', search);
        if (page) params.append('page', String(page));
        if (limit) params.append('limit', String(limit));

        const qs = params.toString();
        return {
          url: `/organizations/activities${qs ? `?${qs}` : ''}`,
          method: REQUEST_METHODS.GET,
        };
      },
      transformResponse: (response: any) => {
        // Handle common response wrapping if necessary, otherwise return data
        return response.data || response;
      },
      providesTags: ['OrgActivities'],
    }),
    
    getMyOrganizationActivities: builder.query<PaginatedActivities, ActivityFilters>({
      query: (filters = {}) => {
        const { sector, when, search, page, limit } = filters;
        const params = new URLSearchParams();
        if (sector) params.append('sector', sector);
        if (when) params.append('when', String(when));
        if (search) params.append('search', search);
        if (page) params.append('page', String(page));
        if (limit) params.append('limit', String(limit));

        const qs = params.toString();
        return {
          url: `/organizations/me/activities${qs ? `?${qs}` : ''}`,
          method: REQUEST_METHODS.GET,
        };
      },
      transformResponse: (response: any) => {
        return response.data || response;
      },
      providesTags: ['OrgActivities'],
    }),

    postOrganizationActivity: builder.mutation<ApiResponse<OrganizationActivity>, Partial<OrganizationActivity>>({
      query: (data) => ({
        url: '/organizations/me/activities',
        method: REQUEST_METHODS.POST,
        body: data,
      }),
      invalidatesTags: ['OrgActivities'],
    }),

    updateOrganizationActivity: builder.mutation<ApiResponse<OrganizationActivity>, { id: string; data: Partial<OrganizationActivity> }>({
      query: ({ id, data }) => ({
        url: `/organizations/me/activities/${id}`,
        method: REQUEST_METHODS.PATCH,
        body: data,
      }),
      invalidatesTags: ['OrgActivities'],
    }),

    deleteOrganizationActivity: builder.mutation<ApiResponse<any>, string>({
      query: (id) => ({
        url: `/organizations/me/activities/${id}`,
        method: REQUEST_METHODS.DELETE,
      }),
      invalidatesTags: ['OrgActivities'],
    }),
  }),
});

export const {
  useGetMySubscriptionsQuery,
  useGetMentionsQuery,
  useGetGeneralAnalyticsQuery,
  useGetCommunitiesQuery,
  useGetCommunityByIdQuery,
  useSubscribeToCommunityMutation,
  useUnsubscribeFromCommunityMutation,
  useGetCommunityAnalyticsQuery,
  useGetCommunityTopicsQuery,
  useGetGlobalTopicsQuery,
  useCreateCommunityTopicMutation,
  useGetTopicByIdQuery,
  useUpdateTopicMutation,
  useReportTopicMutation,
  useToggleTopicLikeMutation,
  useAddCommentMutation,
  useToggleCommentLikeMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useDeleteTopicMutation,
  useSearchCommunityMembersQuery,
  useGetOrganizationActivitiesQuery,
  useGetMyOrganizationActivitiesQuery,
  usePostOrganizationActivityMutation,
  useUpdateOrganizationActivityMutation,
  useDeleteOrganizationActivityMutation,
} = communityApiSlice;

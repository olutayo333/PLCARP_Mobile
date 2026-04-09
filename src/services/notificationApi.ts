import { apiSlice } from './apiSlice';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'ACCOUNT_APPROVED'
  | 'ACCOUNT_REJECTED'
  | 'EVENT_REGISTRATION_CONFIRMED'
  | 'EVENT_UPDATED'
  | 'EVENT_CANCELLED'
  | 'EVENT_REMINDER'
  | 'MENTOR_REQUEST_RECEIVED'
  | 'MENTOR_REQUEST_APPROVED'
  | 'MENTOR_REQUEST_DECLINED'
  | 'MENTOR_SESSION_COMPLETED'
  | 'COMMUNITY_TOPIC_COMMENT'
  | 'COMMUNITY_MENTION'
  | 'COMMUNITY_TOPIC_LIKED'
  | 'RESOURCE_COMPLETED'
  | 'ACHIEVEMENT_EARNED'
  | 'ODA_ASSESSMENT_COMPLETED'
  | 'SYSTEM_ANNOUNCEMENT';

export interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  type: NotificationType;
  data?: any;
  createdAt: string;
  updatedAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

// ─── API Endpoints ────────────────────────────────────────────────────────────

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Fetch all notifications for the current user
     */
    getNotifications: builder.query<
      PaginatedNotifications,
      { isRead?: boolean; type?: NotificationType; page?: number; limit?: number }
    >({
      query: (params) => {
        console.log('[NotificationAPI] getNotifications Params:', params);
        return {
          url: '/notifications',
          params,
        };
      },
      transformResponse: (response: { data: PaginatedNotifications }) => {
        console.log('[NotificationAPI] getNotifications Response:', response.data);
        return response.data;
      },
      providesTags: (result) =>
        result?.notifications
          ? [
            ...result.notifications.map(({ id }) => ({ type: 'Notifications' as const, id })),
            { type: 'Notifications', id: 'LIST' },
          ]
          : [{ type: 'Notifications', id: 'LIST' }],
    }),

    /**
     * Get the current unread notification count
     */
    getUnreadCount: builder.query<UnreadCountResponse, void>({
      query: () => '/notifications/unread-count',
      transformResponse: (response: { data: UnreadCountResponse }) => response.data,
      providesTags: [{ type: 'Notifications', id: 'UNREAD_COUNT' }],
    }),

    /**
     * Mark all notifications as read
     */
    markAllRead: builder.mutation<void, void>({
      query: () => ({
        url: '/notifications/mark-all-read',
        method: 'PATCH',
      }),
      invalidatesTags: [
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'UNREAD_COUNT' },
      ],
    }),

    /**
     * Clear/Delete all notifications for the current user
     */
    clearNotifications: builder.mutation<void, void>({
      query: () => ({
        url: '/notifications/clear',
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'UNREAD_COUNT' },
      ],
    }),

    /**
     * Mark specific notifications as read
     */
    markRead: builder.mutation<void, { ids: string[] }>({
      query: (body) => ({
        url: '/notifications/mark-read',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { ids }) => [
        ...ids.map((id) => ({ type: 'Notifications' as const, id })),
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'UNREAD_COUNT' },
      ],
    }),

    /**
     * Delete a single notification
     */
    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notifications', id },
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'UNREAD_COUNT' },
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
  useClearNotificationsMutation,
  useDeleteNotificationMutation,
} = notificationApi;

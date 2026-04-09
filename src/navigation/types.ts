export type RootStackParamList = {
    MainTabs: undefined;
    TopicDetail: { communityId: string; topicId: string; initialQuoteId?: string; quoteCommentId?: string; replyCommentId?: string };
    ExpertDetail: { expertId: string };
    CreatePost: { communityId?: string } | undefined;
    Login: undefined;
    Register: undefined;
    GuestRegistration: undefined;
    ExpertRegistration: undefined;
    NGORegistration: undefined;
    RegistrationComplete: undefined;
    ForgotPassword: undefined;
    CommunityDetail: { communityId: string };
};

export type MainTabParamList = {
    Home: { initialSubTab?: string } | undefined;
    CommunitiesStack: undefined;
    SearchStack: undefined;
    Notification: undefined;
    ProfileStack: undefined;
};

export type CommunitiesStackParamList = {
    CommunitiesMain: undefined;
    CommunityDetail: { communityId: string };
};

export type SearchStackParamList = {
    SearchMain: undefined;
    ExpertDetail: { expertId: string };
};

export type ProfileStackParamList = {
    ProfileMain: undefined;
    EditProfile: undefined;
    OrgProfile: undefined;
    ExpertProfile: undefined;
    HelpSupport: undefined;
    CommunityGuidelines: undefined;
    TermsOfService: undefined;
};

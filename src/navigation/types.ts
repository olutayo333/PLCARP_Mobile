export type RootStackParamList = {
    MainTabs: undefined;
    TopicDetail: { communityId: string; topicId: string };
    ExpertDetail: { expertId: string };
    CreatePost: undefined;
    Login: undefined;
    Register: undefined;
    GuestRegistration: undefined;
    ExpertRegistration: undefined;
    NGORegistration: undefined;
    RegistrationComplete: undefined;
    ForgotPassword: undefined;
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
};

import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import {
    User,
    Building2,
    Briefcase,
    Shield,
    Bell,
    HelpCircle,
    FileText,
    LogOut,
    ChevronRight,
    ArrowLeft,
    Camera,
    Rss,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/userSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    useGetUserProfileQuery,
    useUpdateUserProfileMutation,
    useGetOrgProfileQuery,
    useUpdateOrgProfileMutation,
    useGetExpertProfileQuery,
    useUpdateExpertProfileMutation,
    uploadAvatarApi,
} from '../services/profileApi';
import { useGetMySubscriptionsQuery } from '../services/communityApi';
import { useSendPasswordVerificationCodeMutation } from '../services/authApi';
import { Skeleton } from '../components/common/Skeleton';

interface ProfileScreenProps {
    onLogout: () => void;
    isLoggedIn?: boolean;
    navigation?: any;
}

export function ProfileScreen({ navigation }: { navigation?: any }) {
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.user.user);
    const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
    const { data: profile, isLoading } = useGetUserProfileQuery(undefined, { skip: !isLoggedIn });
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [currentSubScreen, setCurrentSubScreen] = useState('main');

    const [sendPasswordCode, { isLoading: isSendingPasswordCode }] = useSendPasswordVerificationCodeMutation();
    const { data: subscriptions } = useGetMySubscriptionsQuery(undefined, { skip: !isLoggedIn });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordResetSent, setPasswordResetSent] = useState(false);

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            dispatch(logout());
            setShowLogoutModal(false);
        } catch (e) {
            console.error('Logout failed', e);
        }
    };

    const ProfileSkeleton = () => (
        <View style={styles.profileContainer}>
            <View style={[styles.profileHeaderPremium, { paddingBottom: 60 }]}>
                <View style={styles.profileAvatarRowPremium}>
                    <Skeleton width={80} height={80} borderRadius={40} />
                    <View style={{ marginLeft: 15, flex: 1 }}>
                        <Skeleton width="60%" height={24} style={{ marginBottom: 8 }} />
                        <Skeleton width="40%" height={16} />
                    </View>
                </View>
            </View>
            <View style={[styles.profileSection, { marginTop: -20 }]}>
                <Skeleton width={80} height={12} style={{ marginBottom: 8 }} />
                <View style={[styles.statsCard, { padding: 20 }]}>
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={[styles.statContainer, { borderBottomWidth: i < 4 ? 1 : 0, borderColor: '#f1f5f9' }]}>
                            <Skeleton width={100} height={16} />
                            <Skeleton width={40} height={16} />
                        </View>
                    ))}
                </View>
            </View>
            <View style={styles.profileSection}>
                <Skeleton width={80} height={12} style={{ marginBottom: 8 }} />
                <View style={styles.menuCard}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={{ padding: 16, borderBottomWidth: i < 3 ? 1 : 0, borderColor: '#f1f5f9' }}>
                            <Skeleton width="100%" height={40} borderRadius={8} />
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );

    const MenuItem = ({ icon: Icon, label, subLabel, onPress, isLogout = false }: any) => (
        <TouchableOpacity style={styles.profileMenuItem} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, isLogout && styles.logoutIconContainer]}>
                    <Icon size={18} color={isLogout ? "#ef4444" : "#111827"} />
                </View>
                <View>
                    <Text style={[styles.menuItemLabel, isLogout && styles.logoutLabel]}>{label}</Text>
                    {subLabel ? (
                        <Text style={styles.menuItemSubLabel}>{subLabel}</Text>
                    ) : null}
                </View>
            </View>
            {!isLogout && <ChevronRight size={18} color="#9ca3af" />}
        </TouchableOpacity>
    );

    const StatItem = ({ label, value }: { label: string; value: string | number }) => (
        <View style={styles.statContainer}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
        </View>
    );

    if (isLoading) return <ProfileSkeleton />;

    if (currentSubScreen === 'edit') {
        return <EditProfileScreen onBack={() => setCurrentSubScreen('main')} />;
    }

    if (currentSubScreen === 'org') {
        return <OrgProfileScreen onBack={() => setCurrentSubScreen('main')} />;
    }

    if (currentSubScreen === 'expert') {
        return <ExpertProfileScreen onBack={() => setCurrentSubScreen('main')} />;
    }

    if (!isLoggedIn) {
        return (
            <View style={styles.guestContainer}>
                <ScrollView contentContainerStyle={styles.guestScrollContent}>
                    <View style={styles.guestHeader}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/PLRCAP_ONL_LOGO.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                            <View style={styles.divider} />
                            <Image
                                source={require('../../assets/NORCAP-logo.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.guestTitle}>Your Community Profile</Text>
                        <Text style={styles.guestSubtitle}>
                            Register or login to track your activity, manage your expert profile, and engage with the global PLRCAP network.
                        </Text>
                    </View>

                    <View style={styles.guestActionSection}>
                        <TouchableOpacity
                            style={styles.loginBtn}
                            onPress={() => navigation?.navigate('Login')}
                        >
                            <Text style={styles.loginBtnText}>Login</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.registerBtn}
                            onPress={() => navigation?.navigate('Register')}
                        >
                            <Text style={styles.registerBtnText}>Join Now</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.guestBenefitSection}>
                        <Text style={styles.benefitHeader}>WHY JOIN US?</Text>
                        <View style={styles.benefitItem}>
                            <View style={styles.benefitIcon}>
                                <User size={20} color="#4f46e5" />
                            </View>
                            <Text style={styles.benefitText}>Create your personalized profile</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <View style={styles.benefitIcon}>
                                <Briefcase size={20} color="#0e7490" />
                            </View>
                            <Text style={styles.benefitText}>Become a verified expert</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <View style={styles.benefitIcon}>
                                <Bell size={20} color="#0e7490" />
                            </View>
                            <Text style={styles.benefitText}>Get alerts on latest topics</Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    const handleSubscriptionsPress = () => {
        navigation?.navigate('Home', { initialSubTab: 'subscribed' });
    };

    const userRole = profile?.role || 'Guest';

    const handlePasswordReset = async () => {
        const email = profile?.email || user?.email;
        if (!email) {
            Alert.alert('Error', 'User email not found. Please log in again.');
            return;
        }
        setPasswordResetSent(false);
        setShowPasswordModal(true);
    };

    const handleSendPasswordReset = async () => {
        const email = profile?.email || user?.email;
        if (!email) return;
        try {
            await sendPasswordCode({ email }).unwrap();
            setPasswordResetSent(true);
        } catch (err: any) {
            console.error('Password reset error:', err);
            Alert.alert('Error', err?.data?.message || 'Failed to send reset email. Please try again.');
        }
    };

    const roleColor = userRole === 'Expert' ? '#4f46e5' : userRole === 'NGO' ? '#059669' : '#0e7490';

    // Format date: "Member since 14th Feb, 2026"
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Member since long ago';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Member since long ago';

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Add ordinal suffix logic
        const day = date.getDate();
        let suffix = 'th';
        if (day % 10 === 1 && day !== 11) suffix = 'st';
        else if (day % 10 === 2 && day !== 12) suffix = 'nd';
        else if (day % 10 === 3 && day !== 13) suffix = 'rd';

        return `Member since ${day}${suffix} ${months[date.getMonth()]}, ${date.getFullYear()}`;
    };

    return (
        <View style={styles.profileContainer}>
            <ScrollView contentContainerStyle={styles.profileScrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.profileHeaderPremium}>
                    <View style={styles.profileAvatarRowPremium}>
                        <View style={[styles.mediumAvatarPremium, { backgroundColor: '#ffffff20', overflow: 'hidden' }]}>
                            {profile?.avatarUrl ? (
                                <Image source={{ uri: profile.avatarUrl }} style={styles.mediumAvatarImage} />
                            ) : (
                                <Text style={styles.mediumAvatarTextPremium}>{(profile?.fullName || user?.fullName)?.charAt(0) || 'U'}</Text>
                            )}
                        </View>
                        <View style={styles.profileNameContainerPremium}>
                            <Text style={styles.profileNamePremium}>{profile?.fullName || user?.fullName || 'User Name'}</Text>
                            <Text style={styles.profileEmailPremium}>{formatDate(profile?.createdAt || user?.createdAt)}</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.profileSection, { marginTop: 15 }]}>
                    <Text style={styles.profileSectionHeader}>MY STATS</Text>
                    <View style={styles.statsCard}>
                        <StatItem label="Topics started" value={profile?.metrics?.topicsCount || 0} />
                        <StatItem label="Replies posted" value={profile?.metrics?.repliesPosted || 0} />
                        <StatItem label="Replies received" value={profile?.metrics?.repliesReceived || 0} />
                        <StatItem label="Likes received" value={profile?.metrics?.likesReceived || 0} />
                    </View>
                </View>

                <View style={styles.profileSection}>
                    <Text style={styles.profileSectionHeader}>ACCOUNT</Text>
                    <View style={styles.menuCard}>
                        <MenuItem
                            icon={User}
                            label="Edit profile"
                            subLabel="Name, email & avatar"
                            onPress={() => setCurrentSubScreen('edit')}
                        />
                        <View style={styles.menuDivider} />
                        <MenuItem
                            icon={Shield}
                            label="Password & Security"
                            subLabel="Change password"
                            onPress={handlePasswordReset}
                        />
                        <View style={styles.menuDivider} />
                        <MenuItem
                            icon={Rss}
                            label="My Subscriptions"
                            subLabel={`${subscriptions?.length || 0} Subscriptions`}
                            onPress={handleSubscriptionsPress}
                        />

                        {userRole === 'NGO' && (
                            <>
                                <View style={styles.menuDivider} />
                                <MenuItem
                                    icon={Building2}
                                    label="Organization Profile"
                                    subLabel={profile?.organization?.name || "Manage NGO details"}
                                    onPress={() => setCurrentSubScreen('org')}
                                />
                            </>
                        )}
                        {userRole === 'Expert' && (
                            <>
                                <View style={styles.menuDivider} />
                                <MenuItem
                                    icon={Briefcase}
                                    label="Expert Profile"
                                    subLabel={profile?.expertProfile?.title || "Manage expertise"}
                                    onPress={() => setCurrentSubScreen('expert')}
                                />
                            </>
                        )}
                    </View>
                </View>

                <View style={styles.profileSection}>
                    <Text style={styles.profileSectionHeader}>PREFERENCES</Text>
                    <View style={styles.menuCard}>
                        <MenuItem
                            icon={Bell}
                            label="Notifications"
                            subLabel="Push notifications, emails"
                        />
                    </View>
                </View>

                <View style={styles.profileSection}>
                    <Text style={styles.profileSectionHeader}>SUPPORT</Text>
                    <View style={styles.menuCard}>
                        <MenuItem icon={HelpCircle} label="Help & Support" />
                        <View style={styles.menuDivider} />
                        <MenuItem icon={FileText} label="Community guidelines" />
                        <View style={styles.menuDivider} />
                        <MenuItem icon={FileText} label="Terms of service" />
                        <View style={styles.menuDivider} />
                        <MenuItem
                            icon={LogOut}
                            label="Log out"
                            isLogout
                            onPress={() => setShowLogoutModal(true)}
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Logout Modal */}
            <Modal
                visible={showLogoutModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLogoutModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.logoutModal}>
                        <Text style={styles.logoutModalTitle}>Are you sure you want to log out?</Text>
                        <TouchableOpacity style={styles.confirmLogoutBtn} onPress={handleLogout}>
                            <Text style={styles.confirmLogoutText}>Logout</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelLogoutBtn} onPress={() => setShowLogoutModal(false)}>
                            <Text style={styles.cancelLogoutText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Password Reset Modal */}
            <Modal
                visible={showPasswordModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPasswordModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.passwordModal}>
                        {passwordResetSent ? (
                            <>
                                <View style={styles.passwordSuccessIcon}>
                                    <Shield size={32} color="#059669" />
                                </View>
                                <Text style={styles.passwordModalTitle}>Email Sent!</Text>
                                <Text style={styles.passwordModalSubtitle}>
                                    Password reset instructions have been sent to:
                                </Text>
                                <Text style={styles.passwordModalEmail}>{profile?.email || user?.email}</Text>
                                <Text style={styles.passwordModalHint}>
                                    Please check your inbox and follow the link to reset your password.
                                </Text>
                                <TouchableOpacity
                                    style={styles.passwordModalDoneBtn}
                                    onPress={() => setShowPasswordModal(false)}
                                >
                                    <Text style={styles.passwordModalDoneBtnText}>Done</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View style={styles.passwordModalIconContainer}>
                                    <Shield size={32} color="#0e7490" />
                                </View>
                                <Text style={styles.passwordModalTitle}>Password & Security</Text>
                                <Text style={styles.passwordModalSubtitle}>
                                    We'll send password reset instructions to your registered email address:
                                </Text>
                                <View style={styles.passwordModalEmailBox}>
                                    <Text style={styles.passwordModalEmail}>{profile?.email || user?.email}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.passwordModalSendBtn, isSendingPasswordCode && { opacity: 0.7 }]}
                                    onPress={handleSendPasswordReset}
                                    disabled={isSendingPasswordCode}
                                >
                                    {isSendingPasswordCode ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.passwordModalSendBtnText}>Send Reset Email</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.passwordModalCancelBtn}
                                    onPress={() => setShowPasswordModal(false)}
                                >
                                    <Text style={styles.passwordModalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function EditProfileScreen({ onBack }: { onBack: () => void }) {
    const { data: profile, refetch } = useGetUserProfileQuery();
    const [updateProfile, { isLoading: isUpdating }] = useUpdateUserProfileMutation();
    const [fullName, setFullName] = useState(profile?.fullName || '');
    const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const handleEditAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to change your avatar.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const formData = new FormData();

            // Extract filename from URI if not provided
            const fileName = asset.fileName || asset.uri.split('/').pop() || 'avatar.jpg';
            // Determine type
            const type = asset.mimeType || 'image/jpeg';

            // Format for React Native FormData
            const fileToUpload = {
                uri: asset.uri,
                name: fileName,
                type: type,
            };

            formData.append('file', fileToUpload as any);

            setIsUploadingAvatar(true);
            try {
                const response = await uploadAvatarApi(formData);
                Alert.alert('Success', 'Profile picture updated successfully!');
                refetch(); // Reload profile data to clear cached state and show new avatar
            } catch (error: any) {
                console.error('Avatar upload failed:', error);
                const errorMessage = error?.response?.data?.message || 'Failed to upload avatar. Please try again.';
                Alert.alert('Upload Error', errorMessage);
            } finally {
                setIsUploadingAvatar(false);
            }
        }
    };

    const handlePhoneNumberChange = (text: string) => {
        // Strip everything but numbers and '+'
        let cleaned = text.replace(/[^\d+]/g, '');

        // Remove extra '+' signs if they aren't at the start
        if (cleaned.includes('+') && cleaned.indexOf('+') !== 0) {
            cleaned = cleaned.replace(/\+/g, '');
            if (text.startsWith('+')) cleaned = '+' + cleaned;
        }

        // Limit length (max 15 digits)
        const digitsOnly = cleaned.replace(/\D/g, '');
        if (digitsOnly.length > 15) return;

        // Apply visual formatting: +234 817 263 6377
        let formatted = cleaned;
        if (cleaned.startsWith('+')) {
            const countryCode = cleaned.slice(0, 4);
            const rest = cleaned.slice(4);
            if (rest.length > 0) {
                formatted = countryCode;
                if (rest.length > 0) formatted += ' ' + rest.slice(0, 3);
                if (rest.length > 3) formatted += ' ' + rest.slice(3, 6);
                if (rest.length > 6) formatted += ' ' + rest.slice(6, 10);
            }
        } else if (cleaned.length > 0) {
            // Standard formatting for non-plus numbers
            if (cleaned.length > 3) formatted = cleaned.slice(0, 4) + ' ' + cleaned.slice(4, 7);
            if (cleaned.length > 7) formatted += ' ' + cleaned.slice(7, 11);
        }

        setPhoneNumber(formatted);
    };

    const handleSave = async () => {
        const digitCount = phoneNumber.replace(/\D/g, '').length;

        if (digitCount < 10) {
            Alert.alert('Invalid Phone Number', 'Phone number must be at least 10 digits.');
            return;
        }

        try {
            // Clean before sending to API
            const cleanedPhone = phoneNumber.replace(/\s/g, '');
            const result = await updateProfile({ fullName, phoneNumber: cleanedPhone }).unwrap();
            Alert.alert('Success', result?.message || 'Profile updated successfully.');
            onBack();
        } catch (error) {
            console.error('Failed to update profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        }
    };

    return (
        <View style={styles.editProfileContainer}>
            <View style={styles.editProfileHeader}>
                <TouchableOpacity onPress={onBack}>
                    <ArrowLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.editProfileTitle}>Edit Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.editProfileContent}>
                <View style={styles.avatarEditContainer}>
                    <TouchableOpacity
                        style={[styles.largeAvatar, { overflow: 'hidden' }]}
                        onPress={handleEditAvatar}
                        disabled={isUploadingAvatar}
                    >
                        {profile?.avatarUrl ? (
                            <Image source={{ uri: profile.avatarUrl }} style={styles.largeAvatarImage} />
                        ) : (
                            <Text style={styles.largeAvatarText}>
                                {fullName?.charAt(0) || 'U'}
                            </Text>
                        )}
                        {isUploadingAvatar && (
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center' }]}>
                                <ActivityIndicator color="#0e7490" />
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.editAvatarBtn}
                        onPress={handleEditAvatar}
                        disabled={isUploadingAvatar}
                    >
                        <Text style={styles.editAvatarText}>{isUploadingAvatar ? 'Uploading...' : 'Edit'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.profileInputGroup}>
                    <Text style={styles.profileInputLabel}>Full name</Text>
                    <TextInput
                        style={styles.profileInput}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="User Name"
                    />
                </View>

                <View style={styles.profileInputGroup}>
                    <Text style={styles.profileInputLabel}>Phone number</Text>
                    <TextInput
                        style={styles.profileInput}
                        value={phoneNumber}
                        onChangeText={handlePhoneNumberChange}
                        placeholder="+234..."
                        keyboardType="phone-pad"
                        maxLength={20}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveChangesBtn, isUpdating && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={isUpdating}
                >
                    {isUpdating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveChangesText}>Save changes</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

function OrgProfileScreen({ onBack }: { onBack: () => void }) {
    const { data: org } = useGetOrgProfileQuery();
    const [updateOrg, { isLoading: isUpdating }] = useUpdateOrgProfileMutation();
    const [name, setName] = useState(org?.name || '');
    const [description, setDescription] = useState(org?.description || '');
    const [website, setWebsite] = useState(org?.website || '');

    const handleSave = async () => {
        try {
            const result = await updateOrg({ name, description, website }).unwrap();
            Alert.alert('Success', result?.message || 'Organization profile updated.');
            onBack();
        } catch (error) {
            console.error('Failed to update org profile:', error);
            Alert.alert('Error', 'Failed to update organization profile.');
        }
    };

    return (
        <View style={styles.editProfileContainer}>
            <View style={styles.editProfileHeader}>
                <TouchableOpacity onPress={onBack}>
                    <ArrowLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.editProfileTitle}>Organization Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.editProfileContent}>
                <View style={styles.profileInputGroup}>
                    <Text style={styles.profileInputLabel}>Organization Name</Text>
                    <TextInput
                        style={styles.profileInput}
                        value={name}
                        onChangeText={setName}
                        placeholder="NGO Name"
                    />
                </View>

                <View style={styles.profileInputGroup}>
                    <Text style={styles.profileInputLabel}>Description</Text>
                    <TextInput
                        style={[styles.profileInput, { height: 100, textAlignVertical: 'top' }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="About the NGO..."
                        multiline
                    />
                </View>

                <View style={styles.profileInputGroup}>
                    <Text style={styles.profileInputLabel}>Website</Text>
                    <TextInput
                        style={styles.profileInput}
                        value={website}
                        onChangeText={setWebsite}
                        placeholder="https://..."
                        keyboardType="url"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveChangesBtn, isUpdating && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={isUpdating}
                >
                    {isUpdating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveChangesText}>Save Organization Info</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

function ExpertProfileScreen({ onBack }: { onBack: () => void }) {
    const { data: expert } = useGetExpertProfileQuery();
    const [updateExpert, { isLoading: isUpdating }] = useUpdateExpertProfileMutation();
    const [title, setTitle] = useState(expert?.title || '');
    const [about, setAbout] = useState(expert?.about || '');
    const [yearsOfExperience, setYearsOfExperience] = useState(String(expert?.yearsOfExperience || ''));

    const handleSave = async () => {
        try {
            const result = await updateExpert({
                title,
                about,
                yearsOfExperience: parseInt(yearsOfExperience) || 0
            }).unwrap();
            Alert.alert('Success', result?.message || 'Expert profile updated.');
            onBack();
        } catch (error) {
            console.error('Failed to update expert profile:', error);
            Alert.alert('Error', 'Failed to update expert profile.');
        }
    };

    return (
        <View style={styles.editProfileContainer}>
            <View style={styles.editProfileHeader}>
                <TouchableOpacity onPress={onBack}>
                    <ArrowLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.editProfileTitle}>Expert Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.editProfileContent}>
                <View style={styles.profileInputGroup}>
                    <Text style={styles.profileInputLabel}>Professional Title</Text>
                    <TextInput
                        style={styles.profileInput}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Senior Policy Consultant"
                    />
                </View>

                <View style={styles.profileInputGroup}>
                    <Text style={styles.profileInputLabel}>Years of Experience</Text>
                    <TextInput
                        style={styles.profileInput}
                        value={yearsOfExperience}
                        onChangeText={setYearsOfExperience}
                        placeholder="e.g. 10"
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.profileInputGroup}>
                    <Text style={styles.profileInputLabel}>About / Bio</Text>
                    <TextInput
                        style={[styles.profileInput, { height: 120, textAlignVertical: 'top' }]}
                        value={about}
                        onChangeText={setAbout}
                        placeholder="Tell us about your expertise..."
                        multiline
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveChangesBtn, isUpdating && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={isUpdating}
                >
                    {isUpdating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveChangesText}>Save Expert Info</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    profileContainer: {
        flex: 1,
        backgroundColor: '#f3f4f6', // Light gray background to make cards pop
    },
    profileScrollContent: {
        paddingBottom: 40,
    },
    profileHeaderPremium: {
        backgroundColor: '#00334e', // Deep professional blue/black
        paddingHorizontal: 20,
        paddingTop: 45,
        paddingBottom: 40,
    },
    profileAvatarRowPremium: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mediumAvatarPremium: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#ffffff30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediumAvatarTextPremium: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    mediumAvatarImage: {
        width: '100%',
        height: '100%',
    },
    profileNameContainerPremium: {
        marginLeft: 15,
        flex: 1,
    },
    profileNamePremium: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    profileEmailPremium: {
        fontSize: 14,
        color: '#cbd5e1', // Faded blue-gray for "Member since"
    },
    profileSection: {
        marginTop: 25,
        paddingHorizontal: 16,
    },
    profileSectionHeader: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    statsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    statLabel: {
        fontSize: 15,
        color: '#64748b',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    menuCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginLeft: 52, // Keep alignment with label
    },
    profileMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    logoutIconContainer: {
        backgroundColor: '#fff1f2',
    },
    menuItemLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1e293b',
    },
    logoutLabel: {
        color: '#ef4444',
    },
    menuItemSubLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
    },
    editProfileContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    editProfileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    editProfileTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    editProfileContent: {
        padding: 24,
    },
    avatarEditContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    largeAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    largeAvatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0e7490',
    },
    // mediumAvatarImage: {
    //     width: '100%',
    //     height: '100%',
    // },
    largeAvatarImage: {
        width: '100%',
        height: '100%',
    },
    editAvatarBtn: {
        marginTop: 8,
    },
    editAvatarText: {
        fontSize: 14,
        color: '#0e7490',
        fontWeight: 'bold',
    },
    profileInputGroup: {
        marginBottom: 20,
    },
    profileInputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    profileInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: '#111827',
    },
    saveChangesBtn: {
        backgroundColor: '#0e7490',
        borderRadius: 24,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 12,
    },
    saveChangesText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutModal: {
        backgroundColor: '#fff',
        width: '80%',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
    },
    logoutModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
        color: '#111827',
    },
    confirmLogoutBtn: {
        width: '100%',
        backgroundColor: '#ef4444',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    confirmLogoutText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cancelLogoutBtn: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cancelLogoutText: {
        color: '#6b7280',
        fontWeight: '600',
    },
    guestContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    guestScrollContent: {
        padding: 24,
        paddingTop: 40,
    },
    guestHeader: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
    },
    logoImage: {
        width: 120,
        height: 50,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 4,
    },
    guestTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
    },
    guestSubtitle: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    guestActionSection: {
        gap: 12,
        marginBottom: 48,
    },
    loginBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#0e7490',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    loginBtnText: {
        color: '#0e7490',
        fontSize: 16,
        fontWeight: 'bold',
    },
    registerBtn: {
        backgroundColor: '#0e7490',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    registerBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    guestBenefitSection: {
        backgroundColor: '#f9fafb',
        padding: 24,
        borderRadius: 16,
    },
    benefitHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9ca3af',
        marginBottom: 20,
        letterSpacing: 1,
        textAlign: 'center',
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    benefitIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ecfdf5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    benefitText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    // --- Password Reset Modal ---
    passwordModal: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 28,
        marginHorizontal: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    passwordModalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#ecfdf5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    passwordSuccessIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#d1fae5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    passwordModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 10,
        textAlign: 'center',
    },
    passwordModalSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 16,
    },
    passwordModalEmailBox: {
        backgroundColor: '#f3f4f6',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 24,
        width: '100%',
        alignItems: 'center',
    },
    passwordModalEmail: {
        fontSize: 15,
        color: '#0e7490',
        fontWeight: '700',
        textAlign: 'center',
    },
    passwordModalHint: {
        fontSize: 13,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: 24,
        marginTop: 8,
    },
    passwordModalSendBtn: {
        backgroundColor: '#0e7490',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 28,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
    },
    passwordModalSendBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    passwordModalCancelBtn: {
        paddingVertical: 10,
        width: '100%',
        alignItems: 'center',
    },
    passwordModalCancelText: {
        color: '#6b7280',
        fontSize: 14,
    },
    passwordModalDoneBtn: {
        backgroundColor: '#059669',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 28,
        width: '100%',
        alignItems: 'center',
        marginTop: 8,
    },
    passwordModalDoneBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});

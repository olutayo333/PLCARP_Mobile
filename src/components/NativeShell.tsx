import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Home, Search, Bell, Users, User, Heart } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface NativeShellProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function NativeShell({ children, activeTab = 'home', onTabChange }: NativeShellProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Heart size={24} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Search size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.navBar}>
          <NavItem icon={<Home />} label="Home" active={activeTab === 'home'} onPress={() => onTabChange?.('home')} />
          <NavItem icon={<Users />} label="Communities" active={activeTab === 'communities'} onPress={() => onTabChange?.('communities')} />
          <NavItem icon={<Search />} label="Search" active={activeTab === 'search'} onPress={() => onTabChange?.('search')} />
          <NavItem icon={<Bell />} label="Notification" active={activeTab === 'notification'} onPress={() => onTabChange?.('notification')} />
          <NavItem icon={<User />} label="Profile" active={activeTab === 'profile'} onPress={() => onTabChange?.('profile')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function NavItem({ icon, label, active, onPress }: { icon: React.ReactNode; label: string; active?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      {React.cloneElement(icon as React.ReactElement, {
        size: 24,
        color: active ? '#0e7490' : '#9ca3af',
        fill: active ? '#0e7490' : 'transparent'
      })}
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    maxWidth: 500, // For web preview centering
    width: '100%',
    alignSelf: 'center',
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0e7490',
    letterSpacing: -0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  navLabelActive: {
    color: '#0e7490',
  },
});

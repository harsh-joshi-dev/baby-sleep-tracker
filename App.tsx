import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from './src/store/useStore';
import { SleepLog } from './src/components/SleepLog';
import { Timeline } from './src/components/Timeline';
import { Chart } from './src/components/Chart';
import { Schedule } from './src/components/Schedule';
import { Coach } from './src/components/Coach';
import { NotificationLog } from './src/components/NotificationLog';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { ProfileButton, NotificationLogButton } from './src/components/HeaderActions';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#FF6B9D',
        tabBarInactiveTintColor: '#C4B5FD',
        tabBarStyle: {
          backgroundColor: '#FFF5F8',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#FFF5F8',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#5B4E77',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
        },
      }}
    >
      <Tab.Screen
        name="Log"
        component={SleepLog}
        options={{
          tabBarLabel: 'Log',
          headerTitle: 'Sleep Log',
          headerRight: () => <ProfileButton />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bed-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Timeline"
        component={Timeline}
        options={{
          tabBarLabel: 'Timeline',
          headerTitle: 'Timeline',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chart"
        component={Chart}
        options={{
          tabBarLabel: 'Chart',
          headerTitle: 'Sleep Trends',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={Schedule}
        options={{
          tabBarLabel: 'Schedule',
          headerTitle: 'Smart Schedule',
          headerRight: () => <NotificationLogButton />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Coach"
        component={Coach}
        options={{
          tabBarLabel: 'Coach',
          headerTitle: 'Coach',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFF5F8',
        },
        headerTintColor: '#5B4E77',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="NotificationLog"
        component={NotificationLog}
        options={{ title: 'Notification Log' }}
      />
    </Stack.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF6B9D" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

export default function App() {
  const { initialize, isLoading } = useStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <MainStack />
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B7FA8',
    fontWeight: '500',
  },
});

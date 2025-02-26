import React, { useEffect } from 'react';
import { useMongoDBService } from '@/lib/hooks/useMongoDBService';
import { AppState } from '@/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/lib/hooks/useTheme';

export default function AppStateManager({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { saveAppState, getAppState, isLoading, error } = useMongoDBService();
  
  // Load app state when user logs in
  useEffect(() => {
    const loadAppState = async () => {
      if (!user) return;
      
      try {
        const appState = await getAppState(user.uid);
        if (appState) {
          // Apply loaded preferences
          if (appState.preferences.theme) {
            setTheme(appState.preferences.theme);
          }
          
          // You can apply other preferences here
        }
      } catch (err) {
        console.error('Failed to load app state:', err);
      }
    };
    
    loadAppState();
  }, [user]);
  
  // Save app state periodically or on specific actions
  const saveCurrentAppState = async () => {
    if (!user) return;
    
    try {
      const currentState: AppState = {
        userId: user.uid,
        preferences: {
          theme: theme as 'light' | 'dark' | 'system',
          notifications: true, // Get from your notification settings
          layout: 'default', // Get from your layout settings
          dashboardConfig: {} // Get your dashboard configuration
        },
        updatedAt: new Date().getTime()
      };
      
      await saveAppState(user.uid, currentState);
    } catch (err) {
      console.error('Failed to save app state:', err);
    }
  };
  
  // Save state when theme changes
  useEffect(() => {
    if (user) {
      saveCurrentAppState();
    }
  }, [theme, user]);
  
  // Save state before user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        saveCurrentAppState();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);
  
  return <>{children}</>;
}
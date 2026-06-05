import React, { useState, useEffect } from 'react';
import { 
  GoogleSigninButton,
  statusCodes,
  GoogleSignin,
} from '@react-native-google-signin/google-signin';
import { Alert, ActivityIndicator, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GoogleSignIn = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    console.log('[GoogleSignIn] Component mounted, configuring...');
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: '1090418907591-3d976o7pjema03v8iobulp2v3kuk0d4u.apps.googleusercontent.com',
      offlineAccess: true,
    });
    setConfigured(true);
    console.log('[GoogleSignIn] Configuration complete');
  }, []);

  const handleGoogleSignIn = async () => {
    console.log('[GoogleSignIn] Button clicked, starting sign-in process...');
    
    if (!configured) {
      console.error('[GoogleSignIn] Error: Not configured yet');
      Alert.alert('Error', 'Google Sign-In not configured yet');
      return;
    }

    try {
      setLoading(true);
      console.log('[GoogleSignIn] Loading state set to true');
      
      // Check if Google Play Services are available
      console.log('[GoogleSignIn] Checking Google Play Services...');
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      console.log('[GoogleSignIn] Google Play Services available');
      
      // Sign in with Google
      console.log('[GoogleSignIn] Initiating Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      console.log('[GoogleSignIn] Google Sign-In Success:', userInfo);
      console.log('[GoogleSignIn] User info:', {
        idToken: userInfo.idToken ? 'Present' : 'Missing',
        accessToken: userInfo.accessToken ? 'Present' : 'Missing',
        user: userInfo.user ? userInfo.user : 'No user data',
      });
      
      // Send tokens to backend
      console.log('[GoogleSignIn] Sending tokens to backend...');
      const backendUrl = 'https://sharpie-carless-rimless.ngrok-free.dev/users/auth/google/';
      console.log('[GoogleSignIn] Backend URL:', backendUrl);
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_token: userInfo.idToken,
          access_token: userInfo.accessToken,
        }),
      });
      
      console.log('[GoogleSignIn] Backend response status:', response.status);
      const data = await response.json();
      console.log('[GoogleSignIn] Backend response data:', data);
      
      if (response.ok) {
        console.log('[GoogleSignIn] Backend authentication successful');
        // Store tokens and user data
        console.log('[GoogleSignIn] Storing tokens in AsyncStorage...');
        await AsyncStorage.setItem('access_token', data.tokens.access);
        await AsyncStorage.setItem('refresh_token', data.tokens.refresh);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        console.log('[GoogleSignIn] Tokens stored successfully');

        // Pass client user data to parent
        console.log('[GoogleSignIn] Calling onLogin callback with user data...');
        onLogin(data.user, data.tokens.access);
        console.log('[GoogleSignIn] onLogin callback completed');
      }
 else {
        console.error('[GoogleSignIn] Backend authentication failed:', data);
        Alert.alert('Error', data.error || 'Google sign-in failed');
      }
      
    } catch (error) {
      console.error('[GoogleSignIn] Error occurred:', error);
      console.error('[GoogleSignIn] Error code:', error.code);
      console.error('[GoogleSignIn] Error message:', error.message);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[GoogleSignIn] User cancelled sign-in');
        Alert.alert('Cancelled', 'Sign-in was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('[GoogleSignIn] Sign-in already in progress');
        Alert.alert('In Progress', 'Sign-in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.error('[GoogleSignIn] Play services not available');
        Alert.alert('Error', 'Play services not available');
      } else {
        console.error('[GoogleSignIn] Unknown error:', error);
        Alert.alert('Error', 'Google sign-in failed');
      }
    } finally {
      console.log('[GoogleSignIn] Setting loading to false');
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20, alignItems: 'center', marginTop: 10 }}>
      {loading ? (
        <>
          <ActivityIndicator size="small" color="#4285F4" />
          <Text style={{ marginTop: 10, fontSize: 12, color: 'gray', textAlign: 'center' }}>
            Signing in with Google...
          </Text>
        </>
      ) : (
        <>
          <GoogleSigninButton
            style={{ width: 220, height: 50 }}
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={handleGoogleSignIn}
            disabled={loading}
          />
          <Text style={{ marginTop: 10, fontSize: 12, color: 'gray', textAlign: 'center' }}>
            Sign in as Client with Google
          </Text>
        </>
      )}
    </View>
  );
};

export default GoogleSignIn;

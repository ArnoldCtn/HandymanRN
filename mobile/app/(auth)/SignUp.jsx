import { Alert, Image, Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import React, { useState } from 'react'
import Title from '@/components/Title'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import api from '@/services/api' 
import Toast from '@/components/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import  useGlobal from '@/services/global'
import favicon from '@/assets/images/FullLogo.jpg'
// import GoogleSignIn from '@/components/GoogleSignIn';


console.log('Platform:', Platform.OS);
console.log('Is physical device:', Constants.isDevice);

 function DismissKeyboard({ children }) {
  if (Platform.OS === 'web') return <>{children}</>;
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {children}
    </TouchableWithoutFeedback>
  );
}

export default function SignUpScreen() {
    const router = useRouter()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword,setShowPassword] = useState(false);
  const [email, setEmail] = useState('')

  const login = useGlobal(state => state.login)
  
    const [usernameError, setUsernameError] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [emailError, setEmailError] = useState('')
    const [profilePicture, setProfilePicture] = useState(null)
  
    const pickImage = async ()  => {
      const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted'){
        Alert.alert('Permission needed', 'Please grant permission to access photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing:true,
        aspect:[1,1],
        quality:0.5
      });

      if(!result.canceled){
        setProfilePicture(result.assets[0].uri);
      }
      
    };

     const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  function showToast(message, type = 'success') {
    setToast({ visible: true, message, type });
  }




  
  async function onSignUp() {
    setUsernameError('');
    setEmailError('');
    setPasswordError('');

    const failUsername = !username;
    if (failUsername) setUsernameError('Username is required');

    let failEmail = false;
    if (!email.trim()) {
      setEmailError('Email is required');
      failEmail = true;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      failEmail = true;
    }

    const failPassword = !password;
    if (failPassword) setPasswordError('Password is required');

    if (failUsername || failEmail || failPassword) return;
    

  // ── Convert image to base64 if selected ─────────────────
  let base64Image = null;
  if (profilePicture) {
    try {
      console.log('Converting profile picture to base64...');
      const imgResponse = await fetch(profilePicture);
      const blob = await imgResponse.blob();
      base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      console.log('Profile picture converted to base64');
    } catch (imgErr) {
      console.log('Failed to convert image to base64:', imgErr.message);
    }
  }

  const signupData = {
    username: username.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    password: password,
    user_type: 'client'
  };
  if (base64Image) {
    signupData.thumbnail = base64Image;
  }

  console.log('profile pic:', profilePicture ? 'present (base64)' : 'none');

  let responseData = null;

  // ── 1. Signup with JSON (no FormData) ─────────────────
  try {
    const response = await api({
      method: 'POST',
      url: '/users/signup/',
      data: signupData,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('responseee: ', response);
    responseData = response.data;
  } catch (error) {
    console.log('[SignUp] API error:', error.message);
    console.log('[SignUp] Status:', error.response?.status);
    console.log('[SignUp] Data:', JSON.stringify(error.response?.data));

    if (error.response?.data) {
      const data = error.response.data;
      if (data.username) setUsernameError(data.username[0]);
      if (data.email) setEmailError(data.email[0]);
      if (data.password) setPasswordError(data.password[0]);
      showToast('Please check your entries.', 'error')
    } else {
      setUsernameError(`Network error: ${error.message}`);
      showToast('Network error occurred.', 'error')
    }
    return;
  }

  // ── 2. Store tokens + navigate ────────────────────────
  try {
    const { tokens, user } = responseData;
    await AsyncStorage.setItem('access_token', tokens.access);
    await AsyncStorage.setItem('refresh_token', tokens.refresh);
    await AsyncStorage.setItem('user', JSON.stringify(user)); 

    // ✅ MUST update global state
    login(user);

    showToast('Account created successfully!', 'success');

    setTimeout(() => router.replace('/(auth)/Home'), 1200);
  } catch (storageError) {
    console.log('[SignUp] Post-signup error:', storageError.message);
    router.replace('/(auth)/Home');
  }
}

    function isValidEmail(email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(email.trim().toLowerCase());
      };
    
    
  return (
    <ScrollView>
      <DismissKeyboard>
    <SafeAreaView style={{flex:1}} >
      <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : 'height'}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      style={{flex:1}}
      >
         <View>
                <Image source={favicon} width={200} height={250} alt="" style={{alignSelf:'center',padding:10, height:'250',width:'100%'}} />
              </View>

        <ScrollView contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled">
          <View style={{flex:1,justifyContent:'center',paddingHorizontal:20}}>
                     
            {/* <Title text='Handyman West' color='#202020'  /> */}
              
               <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(t => ({ ...t, visible: false }))}
        />

              <Text style={{textAlign:'center',marginBottom:20, fontSize:36,fontWeight:'black',color:'gray'}}>Sign Up</Text>

                <TouchableOpacity style={styles.ImagePicker} onPress={pickImage}>
                  {profilePicture ? (
                    <Image source={{uri: profilePicture}} style={styles.profileImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.imagePlaceholderText}>Add Profe Picture</Text>
                    </View>
                  )}

                </TouchableOpacity>

            

              <Input title='Username' value={username}
                setValue={setUsername} 
                error={usernameError}
                setError={setUsernameError}  />

              <Input title='Email' setValue={setEmail} 
                error={emailError}
                value={email}
                setError={setEmailError}
                  />

      <View style={{position:'relative'}}>
              <Input title='Password' 
               value={password}
          setValue={setPassword}
          error={passwordError}
          setError={setPasswordError}
          secureTextEntry={!showPassword} />

           <TouchableOpacity style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} 
          size={24} color='black' />
          </TouchableOpacity>

          </View>
    
    
              <Text style={{textAlign:'center', marginVertical:15,color:'gray'}} onPress={() => router.push("SignIn")}>
                Already have an account?
                <Text style={{color:'#0b17f5'}}  onPress={() => router.push("SignIn")} >
                 Sign In 
                </Text>
                </Text>
                
              <Text style={{textAlign:'center', marginVertical:15,color:'gray',fontSize:20}} onPress={() => router.push("handyman/SignUp")}>
                Which to SignUp as a Handyman?
                <Text style={{color:'#f59e0b'}}  onPress={() => router.push("handyman/SignUp")} >
                 Sign Up
                </Text>
                </Text>

              <Button title='Sign Up' onPress={onSignUp} />
              
          </View>
          </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
        </DismissKeyboard>
        </ScrollView>
  )
}

const styles = StyleSheet.create({
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 40,
    padding: 4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  ImagePicker:{
    alignSelf:'center',
    marginBottom:20,
  },

  profileImage:{
    width:100,
    height:100,
    borderRadius:50,
  },
  imagePlaceholder:{
    width:100,
    height:100,
    borderRadius:50,
    backgroundColor:'#ddd',
    justifuContent:'center',
    alignItems:'center'
  },
  imagePlaceholderText:{
    color:'gray',
    fontSize:12,
    textAlign:'center'
  }
})

import { Alert, Image, Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import React, { useState } from 'react'
import Title from '@/components/Title'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import api from '@/services/api' 
import Toast from '@/components/Toast';import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import  useGlobal from '@/services/global'


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
  const failUsername = !username;
  if (failUsername) setUsernameError('Username not provided');

  let failEmail = false;
  if (!email.trim()) {
    setEmailError('Email is required');
    failEmail = true;
  } else if (!isValidEmail(email)) {
    setEmailError('Please enter a valid email address');
    failEmail = true;
  }

  const failPassword = !password;
  if (failPassword) setPasswordError('Password not provided');

  if (failUsername || failEmail || failPassword) return;


  const formData = new FormData;
  formData.append('username', username)
  formData.append('email', email)
  formData.append('password', password)

  if(profilePicture){
    const filename = profilePicture.split('/').pop();
    const ext = filename.split('.').pop();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    formData.append('thumbnail',{
      uri:profilePicture,
      name:filename,
      type:mimeType,
    });
  }

  let responseData = null;

  // ── 1. API call only ──────────────────────────────────
  try {
    const response = await api({
      method: 'POST',
      url: '/users/signup/',
      data: formData,
      headers:{
        'Content-Type': 'multipart/form-data',
      } 
    });
    responseData = response.data;
    login(response.data.user)
  } catch (error) {
    console.log('[SignUp] API error:', error.message);
    console.log('[SignUp] Status:', error.response?.status);
    console.log('[SignUp] Data:', JSON.stringify(error.response?.data));

    if (error.response?.data) {
      const data = error.response.data;
      if (data.username) setUsernameError(data.username[0]);
      if (data.email) setEmailError(data.email[0]);
      if (data.password) setPasswordError(data.password[0]);
    } else {
      setUsernameError(`Network error: ${error.message}`);
    }
    return;
  }

  // ── 2. Store tokens + navigate ────────────────────────
  try {
    const { tokens,user } = responseData;
    await AsyncStorage.setItem('access_token', tokens.access);
    await AsyncStorage.setItem('refresh_token', tokens.refresh);
     await AsyncStorage.setItem('user', JSON.stringify(user)); // store full user

      showToast('Login successful! Redirecting...', 'success');

      // Small delay so the toast is visible before navigating
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
    
    
    
//     const dismissKeyboard = () => {
// Keyboard.dismiss();
// }

  return (
      <DismissKeyboard>
    <SafeAreaView style={{flex:1}} >
      <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : 'height'}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      style={{flex:1}}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled">
          <View style={{flex:1,justifyContent:'center',paddingHorizontal:20}}>
                     
            <Title text='Handyman West' color='#202020'  />
              
               <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(t => ({ ...t, visible: false }))}
        />

              <Text style={{textAlign:'center',marginBottom:24, fontSize:36,fontWeight:'black',color:'gray'}}>Sign Up</Text>

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
                Don &apos;  t have an account?
                <Text style={{color:'blue'}}  onPress={() => router.push("SignIn")} >
                 Sign In 
                </Text>
                </Text>
                
              <Text style={{textAlign:'center', marginVertical:15,color:'gray',fontSize:20}} onPress={() => router.push("handyman/SignUp")}>
                Which to SignUp as a Handyman?
                <Text style={{color:'blue'}}  onPress={() => router.push("handyman/SignUp")} >
                 Sign Up
                </Text>
                </Text>

              <Button title='Sign Up' onPress={onSignUp} />

          </View>
          </ScrollView>
          </KeyboardAvoidingView>
          {/* <Text style={{color:'gray', textAlign:'center', justifyContent:'center'}}>SignInScreen</Text> */}
        </SafeAreaView>
        </DismissKeyboard>
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
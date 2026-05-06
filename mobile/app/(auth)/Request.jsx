import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator,
  RefreshControl, ScrollView,
  Image,
  TouchableOpacity
} from 'react-native'
import api from '@/services/api'
import ServiceCarousel from '@/components/ServiceCarousel'
import useGlobal from '@/services/global'
import Ionicons from '@expo/vector-icons/Ionicons'

export default function RequestScreen() {
  const [services,   setServices]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const user = useGlobal(s => s.user)


  async function fetchServices() {
    try {
      const res = await api.get('/services/')
      setServices(res.data)
    } catch (e) {
      console.log('[Request] fetch:', e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchServices() }, [])

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366F1" />

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchServices() }}
        />
      }
    >
      <View style={styles.heroLeft}>
         <Text style={styles.heroGreet}>
            {new Date().getHours() < 12 ? 'Good morning' :
             new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'} 👋
          </Text>
          <Text style={styles.heroName} numberOfLines={1}>
            {user?.username ?? 'user'}
          </Text>
      </View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <ServiceCarousel services={services} />
      </View>

      <View style={styles.aboutSection}>
        <Text style={styles.title}>About Us</Text>
        <Text style={styles.description}>
          Your one-stop solution for finding reliable handymen in the West Region, Cameroon.
        </Text>

        <View style={styles.featureList}>
          {['Browse Services', 'Find Nearby Pros', 'Book & Pay'].map((item, index) => (
            <View key={index} style={styles.featureCard}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/250' }} 
                style={styles.featureImage} 
              />
              <Text style={styles.featureTitle}>{item}</Text>
              <Text style={styles.featureText}>Reliable solutions tailored to your specific home needs.</Text>
            </View>
          ))}
        </View>

        {/* Why Choose Us */}
        <View style={styles.whySection}>
          <Text style={styles.subTitle}>Why Choose Us?</Text>
          <View style={styles.whyUs}>
          <Text style={styles.whyTitle}>Why Choose Us?</Text>
          {['Trusted Handymen', 'Easy-to-Use System', 'Secure Payments', '7/7 Support'].map((item, i) => (
            <View key={i} style={styles.checkRow}>
              <Ionicons name="checkmark-sharp" size={20} color="white" />
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))} 
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Explore Services</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerBrand}>HandymanWest</Text>
        <Text style={styles.footerText}>arnodlctn@gmail.com</Text>
        <Text style={styles.footerText}>+237 675 828 711</Text>
        <Text style={styles.copy}>© 2024 HandymanWest</Text>
      </View>
      </View>


      

      {/* You can add more sections below e.g. Featured, Nearby etc */}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  header:      { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 26, fontWeight:'black', color: '#202020' },

   heroGreet:            { fontSize:13, color:'#94a3b8', marginBottom:4 },
  heroName:             { fontSize:24, fontWeight:'800', color:'white', marginBottom:10 },
  heroLeft:                 { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#1e293b', paddingHorizontal:20, paddingTop:10, paddingBottom:10 },
 
  aboutSection: { backgroundColor: '#2563eb', padding: 20 },
  aboutHeader: { color: 'white', fontSize: 40, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  aboutLead: { color: 'white', textAlign: 'center', fontSize: 18, marginBottom: 30, lineHeight: 26 },
  
  featuresContainer: { gap: 20 },
  featureCard: { backgroundColor: 'white', borderRadius: 10, overflow: 'hidden', marginBottom: 20 },
  cardImg: { width: '100%', height: 200 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', padding: 10, color: '#333' },
  cardText: { fontSize: 16, paddingHorizontal: 10, paddingBottom: 15, color: '#666' },

  whyUs: { marginTop: 30, paddingBottom: 40 },
  whyTitle: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 15 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkText: { color: 'white', fontSize: 18, marginLeft: 10 },
  
  ctaButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 50, marginTop: 25, alignItems: 'center' },
  ctaText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  footer: { backgroundColor: '#0369a1', padding: 30, alignItems: 'center' },
  footerBrand: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  footerSub: { color: '#e0f2fe', fontSize: 14, marginTop: 5 },
  divider: { height: 1, width: '100%', backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 20 },
  copy: { color: '#e0f2fe', fontSize: 12 }
})
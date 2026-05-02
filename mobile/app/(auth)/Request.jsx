import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator,
  RefreshControl, ScrollView
} from 'react-native'
import api from '@/services/api'
import ServiceCarousel from '@/components/ServiceCarousel'
import useGlobal from '@/services/global'

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
 
})
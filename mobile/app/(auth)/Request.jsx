import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator,
  RefreshControl, ScrollView
} from 'react-native'
import api from '@/services/api'
import ServiceCarousel from '@/components/ServiceCarousel'

export default function RequestScreen() {
  const [services,   setServices]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#202020' },
})
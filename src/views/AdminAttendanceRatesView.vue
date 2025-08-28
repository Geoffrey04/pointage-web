<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const attendance = ref([])

async function loadAttendance() {
  try {
    const { data } = await axios.get('/api/admin/classes/attendance-rate')
    attendance.value = data
  } catch (e) {
    console.error(e)
  }
}

onMounted(loadAttendance)
</script>

<template>
  <v-container class="py-6">
    <v-card class="rounded-xl elevation-2">
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-subtitle-1">Taux de présence par classe</span>
        <v-btn size="small" prepend-icon="mdi-refresh" variant="text" @click="loadAttendance">
          Rafraîchir
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-list>
          <v-list-item v-for="row in attendance" :key="row.id" class="rounded-lg mb-1">
            <v-list-item-title>{{ row.name }}</v-list-item-title>
            <v-list-item-subtitle class="text-medium-emphasis">
              {{ row.presents }}/{{ row.marked }} présents
            </v-list-item-subtitle>
            <template #append>
              <v-chip
                :color="row.rate >= 90 ? 'green' : row.rate >= 75 ? 'orange' : 'red'"
                variant="tonal"
              >
                {{ row.rate }}%
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-container>
</template>

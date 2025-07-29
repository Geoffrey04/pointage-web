import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useAttendanceStore = defineStore('attendance', () => {
  // Structure des présences : { [studentId]: { [date]: 'present' | 'retard' | 'absent' } }
  const attendance = reactive({})

  // Liste des dates de cours (format 'yyyy-mm-dd')
  const dates = reactive([])

  // Ajouter une date (évite les doublons)
  function addDate(newDate) {
    if (!dates.includes(newDate)) {
      dates.push(newDate)
    }
  }

  // Supprimer une date
  function removeDate(dateToRemove) {
    const index = dates.indexOf(dateToRemove)
    if (index !== -1) {
      dates.splice(index, 1)
      // Supprime aussi les présences liées à cette date
      for (const studentId in attendance) {
        delete attendance[studentId][dateToRemove]
      }
    }
  }

  // Affecter une présence à un élève pour une date donnée
  function setAttendance(studentId, date, status) {
    if (!attendance[studentId]) {
      attendance[studentId] = {}
    }
    attendance[studentId][date] = status
  }

  return {
    attendance,
    dates,
    addDate,
    removeDate,
    setAttendance,
  }
})

import { create } from 'zustand'

export type TaskPeriod = 'weekly' | 'monthly'

export interface TaskItem {
  id: string
  title: string
  period: TaskPeriod
  completed: boolean
  effect: number // puana etki (0-20 arası alt kategori)
}

interface TaskState {
  tasks: TaskItem[]
  toggleTask: (id: string) => void
  addTask: (task: TaskItem) => void
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [
    { id: 't1', title: 'Bu hafta 1 birebir görüşme', period: 'weekly', completed: false, effect: 5 },
    { id: 't2', title: 'Bu hafta 2 yönlendirme', period: 'weekly', completed: false, effect: 6 },
    { id: 't3', title: 'Bu ay 2 ziyaretçi getir', period: 'monthly', completed: false, effect: 4 },
    { id: 't4', title: 'Bu ay 4 saat eğitim', period: 'monthly', completed: false, effect: 5 },
  ],
  toggleTask: (id) => set((state) => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
  })),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
}))


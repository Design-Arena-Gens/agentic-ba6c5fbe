'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isToday } from 'date-fns'
import { Plus, TrendingUp, BookHeart, History, Sparkles, ChevronUp, ChevronDown, Trash2, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

interface Habit {
  id: string
  name: string
  importance: number
  createdAt: string
}

interface HabitEntry {
  habitId: string
  date: string
  minutes: number
}

interface GratitudeEntry {
  id: string
  date: string
  content: string
  prompt: string
}

const GRATITUDE_PROMPTS = [
  "What is one thing you're grateful for today?",
  "What made you smile today?",
  "Who said something kind to you recently?",
  "What small moment brought you joy today?",
  "What's something beautiful you noticed today?",
  "Who made a positive difference in your day?",
  "What's a simple pleasure you enjoyed today?",
  "What comfort or luxury are you thankful for?",
  "What achievement, big or small, are you proud of?",
  "What relationship in your life are you grateful for?",
]

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitEntries, setHabitEntries] = useState<HabitEntry[]>([])
  const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>([])
  const [view, setView] = useState<'today' | 'reports' | 'gratitude' | 'history'>('today')
  const [newHabitName, setNewHabitName] = useState('')
  const [todayMinutes, setTodayMinutes] = useState<Record<string, string>>({})
  const [gratitudeText, setGratitudeText] = useState('')
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [isPremium, setIsPremium] = useState(false)
  const [showAIEvaluation, setShowAIEvaluation] = useState(false)

  useEffect(() => {
    const savedHabits = localStorage.getItem('habits')
    const savedEntries = localStorage.getItem('habitEntries')
    const savedGratitude = localStorage.getItem('gratitudeEntries')
    const savedPremium = localStorage.getItem('isPremium')

    if (savedHabits) setHabits(JSON.parse(savedHabits))
    if (savedEntries) setHabitEntries(JSON.parse(savedEntries))
    if (savedGratitude) setGratitudeEntries(JSON.parse(savedGratitude))
    if (savedPremium) setIsPremium(JSON.parse(savedPremium))

    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const todayGratitude = savedGratitude ? JSON.parse(savedGratitude).find((e: GratitudeEntry) => e.date === todayStr) : null

    if (!todayGratitude) {
      const randomPrompt = GRATITUDE_PROMPTS[Math.floor(Math.random() * GRATITUDE_PROMPTS.length)]
      setCurrentPrompt(randomPrompt)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits))
  }, [habits])

  useEffect(() => {
    localStorage.setItem('habitEntries', JSON.stringify(habitEntries))
  }, [habitEntries])

  useEffect(() => {
    localStorage.setItem('gratitudeEntries', JSON.stringify(gratitudeEntries))
  }, [gratitudeEntries])

  useEffect(() => {
    localStorage.setItem('isPremium', JSON.stringify(isPremium))
  }, [isPremium])

  const addHabit = () => {
    if (!newHabitName.trim()) return
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName,
      importance: habits.length + 1,
      createdAt: new Date().toISOString(),
    }
    setHabits([...habits, newHabit])
    setNewHabitName('')
  }

  const moveHabit = (index: number, direction: 'up' | 'down') => {
    const newHabits = [...habits]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newHabits.length) return

    [newHabits[index], newHabits[targetIndex]] = [newHabits[targetIndex], newHabits[index]]
    newHabits.forEach((h, i) => h.importance = i + 1)
    setHabits(newHabits)
  }

  const deleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id))
    setHabitEntries(habitEntries.filter(e => e.habitId !== id))
  }

  const saveHabitEntry = (habitId: string) => {
    const minutes = parseInt(todayMinutes[habitId] || '0')
    if (minutes <= 0) return

    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const existingIndex = habitEntries.findIndex(
      e => e.habitId === habitId && e.date === todayStr
    )

    if (existingIndex >= 0) {
      const newEntries = [...habitEntries]
      newEntries[existingIndex].minutes = minutes
      setHabitEntries(newEntries)
    } else {
      setHabitEntries([...habitEntries, { habitId, date: todayStr, minutes }])
    }

    setTodayMinutes({ ...todayMinutes, [habitId]: '' })
  }

  const saveGratitude = () => {
    if (!gratitudeText.trim()) return

    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const existingIndex = gratitudeEntries.findIndex(e => e.date === todayStr)

    const newEntry: GratitudeEntry = {
      id: Date.now().toString(),
      date: todayStr,
      content: gratitudeText,
      prompt: currentPrompt,
    }

    if (existingIndex >= 0) {
      const newEntries = [...gratitudeEntries]
      newEntries[existingIndex] = newEntry
      setGratitudeEntries(newEntries)
    } else {
      setGratitudeEntries([...gratitudeEntries, newEntry])
    }

    setGratitudeText('')
  }

  const getTodayEntry = (habitId: string) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    return habitEntries.find(e => e.habitId === habitId && e.date === todayStr)
  }

  const getTodayGratitude = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    return gratitudeEntries.find(e => e.date === todayStr)
  }

  const getReportData = (period: 'week' | 'month' | 'year') => {
    const now = new Date()
    let start: Date, end: Date

    if (period === 'week') {
      start = startOfWeek(now, { weekStartsOn: 1 })
      end = endOfWeek(now, { weekStartsOn: 1 })
    } else if (period === 'month') {
      start = startOfMonth(now)
      end = endOfMonth(now)
    } else {
      start = startOfYear(now)
      end = endOfYear(now)
    }

    const startStr = format(start, 'yyyy-MM-dd')
    const endStr = format(end, 'yyyy-MM-dd')

    return habits.map(habit => {
      const entries = habitEntries.filter(
        e => e.habitId === habit.id && e.date >= startStr && e.date <= endStr
      )
      const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0)
      const daysTracked = entries.length

      return {
        name: habit.name,
        totalMinutes,
        daysTracked,
        avgMinutes: daysTracked > 0 ? Math.round(totalMinutes / daysTracked) : 0,
      }
    })
  }

  const generateAIEvaluation = () => {
    const weekData = getReportData('week')
    const monthData = getReportData('month')

    const insights = []

    weekData.forEach((habit, idx) => {
      if (habit.daysTracked >= 5) {
        insights.push(`Great consistency with "${habit.name}"! You've logged ${habit.daysTracked} days this week.`)
      } else if (habit.daysTracked === 0) {
        insights.push(`"${habit.name}" hasn't been tracked this week. Consider starting small with just 5-10 minutes.`)
      }
    })

    const topHabit = [...monthData].sort((a, b) => b.totalMinutes - a.totalMinutes)[0]
    if (topHabit && topHabit.totalMinutes > 0) {
      insights.push(`Your strongest habit this month is "${topHabit.name}" with ${Math.round(topHabit.totalMinutes / 60)} hours invested.`)
    }

    const gratitudeCount = gratitudeEntries.filter(e => {
      const entryDate = new Date(e.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return entryDate >= weekAgo
    }).length

    if (gratitudeCount >= 5) {
      insights.push(`Your gratitude practice is strong with ${gratitudeCount} entries this week. This positive mindset supports all your habits!`)
    }

    return insights.length > 0 ? insights : ['Keep logging your habits to receive personalized AI insights!']
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Habit Tracker</h1>
          <p className="text-gray-600">Build better habits, one day at a time</p>
        </header>

        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setView('today')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === 'today' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="inline w-4 h-4 mr-2" />
            Today
          </button>
          <button
            onClick={() => setView('gratitude')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === 'gratitude' ? 'bg-pink-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BookHeart className="inline w-4 h-4 mr-2" />
            Gratitude
          </button>
          <button
            onClick={() => setView('reports')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === 'reports' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="inline w-4 h-4 mr-2" />
            Reports
          </button>
          <button
            onClick={() => setView('history')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === 'history' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <History className="inline w-4 h-4 mr-2" />
            History
          </button>
          <button
            onClick={() => setIsPremium(!isPremium)}
            className={`ml-auto px-4 py-2 rounded-lg font-medium transition ${
              isPremium ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Sparkles className="inline w-4 h-4 mr-2" />
            {isPremium ? 'Premium Active' : 'Try Premium'}
          </button>
        </div>

        {view === 'today' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Your Habits</h2>

              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addHabit()}
                  placeholder="Add new habit..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={addHabit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {habits.map((habit, index) => {
                  const todayEntry = getTodayEntry(habit.id)
                  return (
                    <div key={habit.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveHabit(index, 'up')}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveHabit(index, 'down')}
                          disabled={index === habits.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{habit.name}</div>
                        {todayEntry && (
                          <div className="text-sm text-green-600">
                            Logged: {todayEntry.minutes} minutes today
                          </div>
                        )}
                      </div>

                      <input
                        type="number"
                        value={todayMinutes[habit.id] || ''}
                        onChange={(e) => setTodayMinutes({ ...todayMinutes, [habit.id]: e.target.value })}
                        placeholder="Minutes"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />

                      <button
                        onClick={() => saveHabitEntry(habit.id)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                      >
                        Log
                      </button>

                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {getTodayGratitude() && (
              <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold mb-2">Today's Gratitude</h3>
                <p className="text-gray-700 italic">"{getTodayGratitude()?.content}"</p>
              </div>
            )}
          </div>
        )}

        {view === 'gratitude' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Gratitude Journal</h2>

            {!getTodayGratitude() ? (
              <div>
                <div className="mb-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                  <p className="text-lg text-gray-800 font-medium">{currentPrompt}</p>
                </div>

                <textarea
                  value={gratitudeText}
                  onChange={(e) => setGratitudeText(e.target.value)}
                  placeholder="Write your response here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 min-h-32"
                />

                <button
                  onClick={saveGratitude}
                  className="mt-4 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
                >
                  Save Gratitude Entry
                </button>
              </div>
            ) : (
              <div className="p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                <p className="text-gray-600 mb-2">{getTodayGratitude()?.prompt}</p>
                <p className="text-lg text-gray-900 italic">"{getTodayGratitude()?.content}"</p>
                <p className="mt-4 text-sm text-gray-500">You've completed today's gratitude entry!</p>
              </div>
            )}

            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Recent Gratitude Entries</h3>
              <div className="space-y-3">
                {gratitudeEntries.slice(-5).reverse().map(entry => (
                  <div key={entry.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">{format(new Date(entry.date), 'MMMM d, yyyy')}</div>
                    <p className="text-gray-900 italic">"{entry.content}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'reports' && (
          <div className="space-y-6">
            {isPremium && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-md p-6 border-2 border-yellow-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">AI Insights</h2>
                  <Sparkles className="w-6 h-6 text-orange-500" />
                </div>
                <div className="space-y-3">
                  {generateAIEvaluation().map((insight, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg">
                      <p className="text-gray-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Weekly Report</h2>
              <div className="space-y-4">
                {getReportData('week').map(data => (
                  <div key={data.name} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">{data.name}</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Total Time</div>
                        <div className="text-xl font-bold text-indigo-600">{Math.round(data.totalMinutes / 60)}h {data.totalMinutes % 60}m</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Days Tracked</div>
                        <div className="text-xl font-bold text-indigo-600">{data.daysTracked}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Avg/Day</div>
                        <div className="text-xl font-bold text-indigo-600">{data.avgMinutes}m</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Monthly Report</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getReportData('month')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalMinutes" fill="#6366f1" name="Total Minutes" />
                  <Bar dataKey="daysTracked" fill="#ec4899" name="Days Tracked" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Year End Report</h2>
              <div className="space-y-4">
                {getReportData('year').map(data => (
                  <div key={data.name} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">{data.name}</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Total Time</div>
                        <div className="text-xl font-bold text-indigo-600">{Math.round(data.totalMinutes / 60)}h</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Days Tracked</div>
                        <div className="text-xl font-bold text-indigo-600">{data.daysTracked}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Consistency</div>
                        <div className="text-xl font-bold text-indigo-600">{Math.round((data.daysTracked / 365) * 100)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Habit History</h2>
              <div className="space-y-4">
                {habits.map(habit => {
                  const entries = habitEntries
                    .filter(e => e.habitId === habit.id)
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 10)

                  return (
                    <div key={habit.id} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-bold text-lg mb-3">{habit.name}</h3>
                      <div className="space-y-2">
                        {entries.map(entry => (
                          <div key={`${entry.habitId}-${entry.date}`} className="flex justify-between text-sm">
                            <span className="text-gray-600">{format(new Date(entry.date), 'MMMM d, yyyy')}</span>
                            <span className="font-medium text-indigo-600">{entry.minutes} minutes</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Gratitude History</h2>
              <div className="space-y-3">
                {gratitudeEntries.slice().reverse().map(entry => (
                  <div key={entry.id} className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">{format(new Date(entry.date), 'MMMM d, yyyy')}</div>
                    <div className="text-xs text-gray-500 mb-1">{entry.prompt}</div>
                    <p className="text-gray-900 italic">"{entry.content}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

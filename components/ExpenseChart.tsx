'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { format, startOfMonth, isSameMonth } from 'date-fns'

interface Expense {
  id: string
  title: string
  amount: number
  createdAt: string
  category: {
    id: string
    name: string
    color: string
  }
}

interface ExpenseChartProps {
  expenses: Expense[]
  type?: 'line' | 'category' | 'monthly'
}

export function ExpenseChart({ expenses, type = 'line' }: ExpenseChartProps) {
  if (type === 'category') {
    // Group expenses by category
    const categoryData = expenses.reduce((acc, expense) => {
      const categoryName = expense.category.name
      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          value: 0,
          color: expense.category.color,
        }
      }
      acc[categoryName].value += expense.amount
      return acc
    }, {} as Record<string, { name: string; value: number; color: string }>)

    const data = Object.values(categoryData)

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No data to display</p>
        </div>
      )
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'monthly') {
    // Group expenses by month
    const monthlyData = expenses.reduce((acc, expense) => {
      const monthKey = format(new Date(expense.createdAt), 'yyyy-MM')
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: format(new Date(expense.createdAt), 'MMM yyyy'),
          amount: 0,
        }
      }
      acc[monthKey].amount += expense.amount
      return acc
    }, {} as Record<string, { month: string; amount: number }>)

    const data = Object.values(monthlyData).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    )

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No data to display</p>
        </div>
      )
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} />
          <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
          <Bar dataKey="amount" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  // Default line chart - expenses over time
  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const data = sortedExpenses.map((expense, index) => ({
    date: format(new Date(expense.createdAt), 'MMM dd'),
    amount: expense.amount,
    cumulative: sortedExpenses.slice(0, index + 1).reduce((sum, e) => sum + e.amount, 0),
  }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No data to display</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} />
        <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
        <Line 
          type="monotone" 
          dataKey="amount" 
          stroke="#3B82F6" 
          strokeWidth={2}
          dot={{ fill: '#3B82F6' }}
          name="Expense Amount"
        />
        <Line 
          type="monotone" 
          dataKey="cumulative" 
          stroke="#10B981" 
          strokeWidth={2}
          dot={{ fill: '#10B981' }}
          name="Cumulative"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
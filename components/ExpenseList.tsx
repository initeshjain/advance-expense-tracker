'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { CalendarDays, Users, IndianRupee } from 'lucide-react'
import { format } from 'date-fns'

interface Expense {
  id: string
  title: string
  description?: string
  amount: number
  currency: string
  isSplit: boolean
  createdAt: string
  category: {
    id: string
    name: string
    color: string
  }
  createdBy: {
    name: string
    email: string
  }
  participants: Array<{
    id: string
    shareAmount: number
    isPaid: boolean
    user: {
      name: string
      email: string
    }
  }>
}

interface ExpenseListProps {
  expenses: Expense[]
  loading: boolean
  compact?: boolean
}

export function ExpenseList({ expenses, loading, compact = false }: ExpenseListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <IndianRupee className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No expenses found</p>
        <p className="text-sm">Start by adding your first expense!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <Card key={expense.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{expense.title}</h3>
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${expense.category.color}20`,
                      color: expense.category.color,
                      borderColor: expense.category.color
                    }}
                  >
                    {expense.category.name}
                  </Badge>
                  {expense.isSplit && (
                    <Badge variant="outline" className="text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      Split
                    </Badge>
                  )}
                </div>
                {expense.description && !compact && (
                  <p className="text-gray-600 text-sm mb-2">{expense.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  ₹{expense.amount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {expense.currency}
                </p>
              </div>
            </div>

            {!compact && (
              <>
                <Separator className="my-3" />
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" />
                      <span>{format(new Date(expense.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-xs">
                          {expense.createdBy.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span>by {expense.createdBy.name}</span>
                    </div>
                  </div>
                  
                  {expense.isSplit && expense.participants.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{expense.participants.length + 1} people</span>
                    </div>
                  )}
                </div>

                {expense.isSplit && expense.participants.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Split Details:</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{expense.createdBy.name} (You)</span>
                        <span className="text-green-600 font-medium">
                          ₹{(expense.amount / (expense.participants.length + 1)).toFixed(2)}
                        </span>
                      </div>
                      {expense.participants.map((participant) => (
                        <div key={participant.id} className="flex justify-between text-sm">
                          <span>{participant.user.name}</span>
                          <span className={participant.isPaid ? 'text-green-600' : 'text-red-600'}>
                            ₹{participant.shareAmount.toFixed(2)}
                            {!participant.isPaid && ' (unpaid)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
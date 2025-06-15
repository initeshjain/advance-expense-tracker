'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { CalendarDays, Users, IndianRupee, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ExpenseForm } from '@/components/ExpenseForm'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

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
  onExpenseUpdated?: () => void
  onExpenseDeleted?: () => void
}

export function ExpenseList({ expenses, loading, compact = false, onExpenseUpdated, onExpenseDeleted }: ExpenseListProps) {
  const { data: session } = useSession()
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [categories, setCategories] = useState([])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    fetchCategories()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onExpenseDeleted?.()
      } else {
        throw new Error('Failed to delete expense')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error('Failed to delete expense')
    }
  }

  const handleExpenseUpdated = () => {
    setEditingExpense(null)
    onExpenseUpdated?.()
  }

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
    <>
      <div className="space-y-4">
        {expenses.map((expense) => {
          // Calculate split details correctly
          const isCreator = expense.createdBy.email === session?.user?.email
          const myParticipation = expense.participants.find(p => p.user.email === session?.user?.email)
          const otherParticipants = expense.participants.filter(p => p.user.email !== session?.user?.email)

          return (
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
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{expense.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {expense.currency}
                      </p>
                    </div>
                    {!compact && isCreator && (
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(expense)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
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
                          <span>{expense.participants.length + (isCreator ? 0 : 1)} people</span>
                        </div>
                      )}
                    </div>

                    {expense.isSplit && expense.participants.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium mb-2">Split Details:</p>
                        <div className="space-y-1">
                          {/* Show creator's share if they are a participant or if viewing as creator */}
                          {isCreator && (
                            <div className="flex justify-between text-sm">
                              <span>{expense.createdBy.name} (You)</span>
                              <span className="text-green-600 font-medium">
                                ₹{(expense.amount / (expense.participants.length + 1)).toFixed(2)} (paid)
                              </span>
                            </div>
                          )}

                          {/* Show current user's participation if they're not the creator */}
                          {!isCreator && myParticipation && (
                            <div className="flex justify-between text-sm">
                              <span>You</span>
                              <span className={myParticipation.isPaid ? 'text-green-600' : 'text-red-600'}>
                                ₹{myParticipation.shareAmount.toFixed(2)}
                                {!myParticipation.isPaid && ' (unpaid)'}
                              </span>
                            </div>
                          )}

                          {/* Show other participants */}
                          {otherParticipants.map((participant) => (
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
          )
        })}
      </div>

      <Dialog open={!!editingExpense} onOpenChange={() => setEditingExpense(null)}>
        <DialogContent className="max-w-2xl">
          {editingExpense && (
            <ExpenseForm
              categories={categories}
              expense={editingExpense}
              onExpenseUpdated={handleExpenseUpdated}
              onExpenseCreated={() => { }}
              onCategoryCreated={fetchCategories}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
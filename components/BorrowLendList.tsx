'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { CalendarDays, Users, IndianRupee, Edit, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { format } from 'date-fns'
import { BorrowLendForm } from '@/components/BorrowLendForm'
import { toast } from 'sonner'

interface BorrowLend {
    id: string
    title: string
    description?: string
    amount: number
    currency: string
    type: string
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
        amount: number
        isSettled: boolean
        user: {
            name: string
            email: string
        }
    }>
}

interface BorrowLendListProps {
    borrowLends: BorrowLend[]
    loading: boolean
    compact?: boolean
    onBorrowLendUpdated?: () => void
    onBorrowLendDeleted?: () => void
}

export function BorrowLendList({ borrowLends, loading, compact = false, onBorrowLendUpdated, onBorrowLendDeleted }: BorrowLendListProps) {
    const [editingBorrowLend, setEditingBorrowLend] = useState<BorrowLend | null>(null)
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

    const handleEdit = (borrowLend: BorrowLend) => {
        setEditingBorrowLend(borrowLend)
        fetchCategories()
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this record?')) return

        try {
            const response = await fetch(`/api/borrow-lend/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                onBorrowLendDeleted?.()
            } else {
                throw new Error('Failed to delete record')
            }
        } catch (error) {
            console.error('Error deleting record:', error)
            toast.error('Failed to delete record')
        }
    }

    const handleBorrowLendUpdated = () => {
        setEditingBorrowLend(null)
        onBorrowLendUpdated?.()
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

    if (borrowLends.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <IndianRupee className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No borrow/lend records found</p>
                <p className="text-sm">Start by adding your first record!</p>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-4">
                {borrowLends.map((borrowLend) => (
                    <Card key={borrowLend.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-lg">{borrowLend.title}</h3>
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                            style={{
                                                backgroundColor: `${borrowLend.category.color}20`,
                                                color: borrowLend.category.color,
                                                borderColor: borrowLend.category.color
                                            }}
                                        >
                                            {borrowLend.category.name}
                                        </Badge>
                                        <Badge
                                            variant={borrowLend.type === 'BORROW' ? 'destructive' : 'default'}
                                            className="text-xs"
                                        >
                                            {borrowLend.type === 'BORROW' ? (
                                                <>
                                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                                    Borrowed
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowDownLeft className="w-3 h-3 mr-1" />
                                                    Lent
                                                </>
                                            )}
                                        </Badge>
                                    </div>
                                    {borrowLend.description && !compact && (
                                        <p className="text-gray-600 text-sm mb-2">{borrowLend.description}</p>
                                    )}
                                </div>
                                <div className="text-right flex items-center gap-2">
                                    <div>
                                        <p className={`text-2xl font-bold ${borrowLend.type === 'BORROW' ? 'text-red-600' : 'text-green-600'}`}>
                                            ₹{borrowLend.amount.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {borrowLend.currency}
                                        </p>
                                    </div>
                                    {!compact && (
                                        <div className="flex flex-col gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(borrowLend)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(borrowLend.id)}
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
                                                <span>{format(new Date(borrowLend.createdAt), 'MMM dd, yyyy')}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Avatar className="w-5 h-5">
                                                    <AvatarFallback className="text-xs">
                                                        {borrowLend.createdBy.name?.charAt(0) || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span>by {borrowLend.createdBy.name}</span>
                                            </div>
                                        </div>

                                        {borrowLend.participants.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                <span>{borrowLend.participants.length} people</span>
                                            </div>
                                        )}
                                    </div>

                                    {borrowLend.participants.length > 0 && (
                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm font-medium mb-2">
                                                {borrowLend.type === 'BORROW' ? 'Borrowed From:' : 'Lent To:'}
                                            </p>
                                            <div className="space-y-1">
                                                {borrowLend.participants.map((participant) => (
                                                    <div key={participant.id} className="flex justify-between text-sm">
                                                        <span>{participant.user.name}</span>
                                                        <span className={participant.isSettled ? 'text-green-600' : 'text-red-600'}>
                                                            ₹{participant.amount.toFixed(2)}
                                                            {!participant.isSettled && ' (unsettled)'}
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

            <Dialog open={!!editingBorrowLend} onOpenChange={() => setEditingBorrowLend(null)}>
                <DialogContent className="max-w-2xl">
                    {editingBorrowLend && (
                        <BorrowLendForm
                            categories={categories}
                            borrowLend={editingBorrowLend}
                            onBorrowLendUpdated={handleBorrowLendUpdated}
                            onBorrowLendCreated={() => { }}
                            onCategoryCreated={fetchCategories}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Navbar } from '@/components/Navbar'
import { ExpenseForm } from '@/components/ExpenseForm'
import { BorrowLendForm } from '@/components/BorrowLendForm'
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    Edit,
    Trash2,
    Users,
    IndianRupee,
    ArrowUpRight,
    ArrowDownLeft,
    Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import Link from 'next/link'

interface BalanceItem {
    id: string
    type: 'expense' | 'borrow' | 'lend'
    title: string
    description?: string
    amount: number
    shareAmount?: number
    createdAt: string
    isPaid?: boolean
    isSettled?: boolean
    category: {
        name: string
        color: string
    }
    createdBy: {
        name: string
        email: string
    }
    user?: {
        name: string
        email: string
    }
    expense?: any
    borrowLend?: any
}

interface GroupedBalances {
    [personEmail: string]: {
        personName: string
        personEmail: string
        items: BalanceItem[]
        totalAmount: number
    }
}

export default function BalancesPage() {
    const { data: session, status } = useSession()
    const [balances, setBalances] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
    const [bulkLoading, setBulkLoading] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)
    const [categories, setCategories] = useState([])

    useEffect(() => {
        if (status === 'authenticated') {
            fetchBalances()
            fetchCategories()
        }
    }, [status])

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    if (status === 'unauthenticated') {
        redirect('/auth/signin')
    }

    const fetchBalances = async () => {
        try {
            const response = await fetch('/api/balances')
            if (response.ok) {
                const data = await response.json()
                setBalances(data)
            }
        } catch (error) {
            console.error('Error fetching balances:', error)
            toast.error('Failed to fetch balances')
        } finally {
            setLoading(false)
        }
    }

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

    const groupBalancesByPerson = (items: any[], type: 'owed' | 'owedToMe'): GroupedBalances => {
        const grouped: GroupedBalances = {}

        items.forEach(item => {
            let personEmail: string | undefined
            let personName: string | undefined
            let amount: number | undefined

            if (item.expense) {
                if (type === 'owed') {
                    personEmail = item.expense.createdBy?.email
                    personName = item.expense.createdBy?.name
                } else {
                    personEmail = item.user?.email
                    personName = item.user?.name
                }
                amount = item.shareAmount
            } else if (item.borrowLend) {
                if (item.borrowLend.createdById === session?.user?.id) {
                    personEmail = item.user?.email
                    personName = item.user?.name
                } else {
                    personEmail = item.borrowLend.createdBy?.email
                    personName = item.borrowLend.createdBy?.name
                }
                amount = item.amount
            }

            // ✅ Skip if any critical data is missing
            if (!personEmail || !personName || amount === undefined) return

            if (!grouped[personEmail]) {
                grouped[personEmail] = {
                    personName,
                    personEmail,
                    items: [],
                    totalAmount: 0
                }
            }

            const balanceItem: BalanceItem = {
                id: item.id,
                type: item.expense ? 'expense' : (item.borrowLend?.type === 'BORROW' ? 'borrow' : 'lend'),
                title: item.expense?.title || item.borrowLend?.title,
                description: item.expense?.description || item.borrowLend?.description,
                amount: item.expense?.amount || item.borrowLend?.amount,
                shareAmount: item.shareAmount || item.amount,
                createdAt: item.expense?.createdAt || item.borrowLend?.createdAt,
                isPaid: item.isPaid,
                isSettled: item.isSettled,
                category: item.expense?.category || item.borrowLend?.category,
                createdBy: item.expense?.createdBy || item.borrowLend?.createdBy,
                user: item.user,
                expense: item.expense,
                borrowLend: item.borrowLend
            }

            grouped[personEmail].items.push(balanceItem)
            grouped[personEmail].totalAmount += amount
        })

        return grouped
    }

    const handleItemSelect = (itemId: string, checked: boolean) => {
        const newSelected = new Set(selectedItems)
        if (checked) {
            newSelected.add(itemId)
        } else {
            newSelected.delete(itemId)
        }
        setSelectedItems(newSelected)
    }

    const handleSelectAll = (items: BalanceItem[], checked: boolean) => {
        const newSelected = new Set(selectedItems)
        items.forEach(item => {
            if (checked) {
                newSelected.add(item.id)
            } else {
                newSelected.delete(item.id)
            }
        })
        setSelectedItems(newSelected)
    }

    const handleBulkMarkComplete = async () => {
        if (selectedItems.size === 0) return

        setBulkLoading(true)
        try {
            const promises = Array.from(selectedItems).map(async (itemId) => {
                // Find the item to determine if it's expense or borrow/lend
                const allItems = [
                    ...balances.owedExpenses,
                    ...balances.owedToMeExpenses,
                    ...balances.borrowLends
                ]
                const item = allItems.find(i => i.id === itemId)

                if (item.expense) {
                    return fetch(`/api/expenses/participants/${itemId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isPaid: true })
                    })
                } else {
                    return fetch(`/api/borrow-lend/participants/${itemId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isSettled: true })
                    })
                }
            })

            await Promise.all(promises)
            setSelectedItems(new Set())
            fetchBalances()
            toast.success('Items marked as complete!')
        } catch (error) {
            console.error('Error marking items as complete:', error)
            toast.error('Failed to mark items as complete')
        } finally {
            setBulkLoading(false)
        }
    }

    const handleBulkDelete = async () => {
        if (selectedItems.size === 0) return
        if (!confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) return

        setBulkLoading(true)
        try {
            const promises = Array.from(selectedItems).map(async (itemId) => {
                const allItems = [
                    ...balances.owedExpenses,
                    ...balances.owedToMeExpenses,
                    ...balances.borrowLends
                ]
                const item = allItems.find(i => i.id === itemId)

                if (item.expense) {
                    return fetch(`/api/expenses/${item.expense.id}`, { method: 'DELETE' })
                } else {
                    return fetch(`/api/borrow-lend/${item.borrowLend.id}`, { method: 'DELETE' })
                }
            })

            await Promise.all(promises)
            setSelectedItems(new Set())
            fetchBalances()
            toast.success('Items deleted successfully!')
        } catch (error) {
            console.error('Error deleting items:', error)
            toast.error('Failed to delete items')
        } finally {
            setBulkLoading(false)
        }
    }

    const handleMarkComplete = async (item: BalanceItem) => {
        try {
            if (item.expense) {
                await fetch(`/api/expenses/participants/${item.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isPaid: true })
                })
            } else {
                await fetch(`/api/borrow-lend/participants/${item.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isSettled: true })
                })
            }
            fetchBalances()
            toast.success('Marked as complete!')
        } catch (error) {
            console.error('Error marking as complete:', error)
            toast.error('Failed to mark as complete')
        }
    }

    const handleEdit = (item: BalanceItem) => {
        setEditingItem(item)
    }

    const handleDelete = async (item: BalanceItem) => {
        if (!confirm('Are you sure you want to delete this item?')) return

        try {
            if (item.expense) {
                await fetch(`/api/expenses/${item.expense.id}`, { method: 'DELETE' })
            } else {
                await fetch(`/api/borrow-lend/${item.borrowLend.id}`, { method: 'DELETE' })
            }
            fetchBalances()
            toast.success('Item deleted successfully!')
        } catch (error) {
            console.error('Error deleting item:', error)
            toast.error('Failed to delete item')
        }
    }

    const renderBalanceGroup = (grouped: GroupedBalances, type: 'owed' | 'owedToMe') => {
        return Object.values(grouped).map(group => (
            <Card key={group.personEmail} className="mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarFallback>
                                    {group.personName?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-lg">{group.personName}</CardTitle>
                                <CardDescription>{group.personEmail}</CardDescription>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`text-2xl font-bold ${type === 'owed' ? 'text-red-600' : 'text-green-600'}`}>
                                ₹{group.totalAmount.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">{group.items.length} items</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <Checkbox
                            checked={group.items.every(item => selectedItems.has(item.id))}
                            onCheckedChange={(checked) => handleSelectAll(group.items, checked as boolean)}
                        />
                        <span className="text-sm text-gray-600">Select all</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {group.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        checked={selectedItems.has(item.id)}
                                        onCheckedChange={(checked) => handleItemSelect(item.id, checked as boolean)}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium">{item.title}</h4>
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                                style={{
                                                    backgroundColor: `${item.category.color}20`,
                                                    color: item.category.color
                                                }}
                                            >
                                                {item.category?.name}
                                            </Badge>
                                            {item.type === 'borrow' && (
                                                <Badge variant="destructive" className="text-xs">
                                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                                    Borrowed
                                                </Badge>
                                            )}
                                            {item.type === 'lend' && (
                                                <Badge variant="default" className="text-xs">
                                                    <ArrowDownLeft className="w-3 h-3 mr-1" />
                                                    Lent
                                                </Badge>
                                            )}
                                        </div>
                                        {item.description && (
                                            <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                            {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right mr-4">
                                        <p className="font-semibold">₹{item.shareAmount?.toFixed(2)}</p>
                                        {item.amount !== item.shareAmount && (
                                            <p className="text-xs text-gray-500">of ₹{item.amount}</p>
                                        )}
                                    </div>
                                    {!(item.isPaid || item.isSettled) && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleMarkComplete(item)}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(item)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(item)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </>
                                    )}
                                    {(item.isPaid || item.isSettled) && (
                                        <Badge variant="default" className="text-xs">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Complete
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        ))
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                </div>
            </div>
        )
    }

    const owedGrouped = groupBalancesByPerson(balances.owedExpenses.concat(
        balances.borrowLends.filter((bl: any) =>
            (bl.userId === session?.user?.id && bl.borrowLend.type === 'BORROW') ||
            (bl.borrowLend.createdById === session?.user?.id && bl.borrowLend.type === 'LEND')
        )
    ), 'owed')

    const owedToMeGrouped = groupBalancesByPerson(balances.owedToMeExpenses.concat(
        balances.borrowLends.filter((bl: any) =>
            (bl.userId === session?.user?.id && bl.borrowLend.type === 'LEND') ||
            (bl.borrowLend.createdById === session?.user?.id && bl.borrowLend.type === 'BORROW')
        )
    ), 'owedToMe')

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Balance Management</h1>
                            <p className="text-gray-600 mt-1">Manage your outstanding balances</p>
                        </div>
                    </div>

                    {selectedItems.size > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                                {selectedItems.size} selected
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkMarkComplete}
                                disabled={bulkLoading}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Complete
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                                disabled={bulkLoading}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    )}
                </div>

                <Tabs defaultValue="owed" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="owed" className="flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4 text-red-500" />
                            You Owe (₹{balances.totalOwed.toLocaleString()})
                        </TabsTrigger>
                        <TabsTrigger value="owed-to-me" className="flex items-center gap-2">
                            <ArrowDownLeft className="w-4 h-4 text-green-500" />
                            Owed to You (₹{balances.totalOwedToMe.toLocaleString()})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="owed" className="space-y-6">
                        {Object.keys(owedGrouped).length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <IndianRupee className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">No outstanding debts</p>
                                <p className="text-sm">You don't owe anyone money!</p>
                            </div>
                        ) : (
                            renderBalanceGroup(owedGrouped, 'owed')
                        )}
                    </TabsContent>

                    <TabsContent value="owed-to-me" className="space-y-6">
                        {Object.keys(owedToMeGrouped).length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <IndianRupee className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">No money owed to you</p>
                                <p className="text-sm">Nobody owes you money!</p>
                            </div>
                        ) : (
                            renderBalanceGroup(owedToMeGrouped, 'owedToMe')
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
                <DialogContent className="max-w-2xl">
                    {editingItem && editingItem.expense && (
                        <ExpenseForm
                            categories={categories}
                            expense={editingItem.expense}
                            onExpenseUpdated={() => {
                                setEditingItem(null)
                                fetchBalances()
                                toast.success('Expense updated successfully!')
                            }}
                            onExpenseCreated={() => { }}
                            onCategoryCreated={fetchCategories}
                        />
                    )}
                    {editingItem && editingItem.borrowLend && (
                        <BorrowLendForm
                            categories={categories}
                            borrowLend={editingItem.borrowLend}
                            onBorrowLendUpdated={() => {
                                setEditingItem(null)
                                fetchBalances()
                                toast.success('Borrow/Lend record updated successfully!')
                            }}
                            onBorrowLendCreated={() => { }}
                            onCategoryCreated={fetchCategories}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
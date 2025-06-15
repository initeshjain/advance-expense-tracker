'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, TrendingUp as TrendUp, Users, IndianRupee, Filter, ArrowUpRight, ArrowDownLeft, Handshake } from 'lucide-react'
import { ExpenseForm } from '@/components/ExpenseForm'
import { ExpenseList } from '@/components/ExpenseList'
import { ExpenseChart } from '@/components/ExpenseChart'
import { BorrowLendForm } from '@/components/BorrowLendForm'
import { BorrowLendList } from '@/components/BorrowLendList'
import { ContactsList } from '@/components/ContactsList'
import { Navbar } from '@/components/Navbar'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import Link from 'next/link'

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

interface Category {
  id: string
  name: string
  color: string
}

interface Balances {
  totalOwed: number
  totalOwedToMe: number
  owedExpenses: any[]
  owedToMeExpenses: any[]
  borrowLends: any[]
}

export function Dashboard() {
  const { data: session } = useSession()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [borrowLends, setBorrowLends] = useState<BorrowLend[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [balances, setBalances] = useState<Balances>({
    totalOwed: 0,
    totalOwedToMe: 0,
    owedExpenses: [],
    owedToMeExpenses: [],
    borrowLends: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false)
  const [isBorrowLendFormOpen, setIsBorrowLendFormOpen] = useState(false)

  useEffect(() => {
    fetchExpenses()
    fetchBorrowLends()
    fetchCategories()
    fetchBalances()
  }, [])

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Failed to fetch expenses')
    } finally {
      setLoading(false)
    }
  }

  const fetchBorrowLends = async () => {
    try {
      const response = await fetch('/api/borrow-lend')
      if (response.ok) {
        const data = await response.json()
        setBorrowLends(data)
      }
    } catch (error) {
      console.error('Error fetching borrow/lend records:', error)
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

  const fetchBalances = async () => {
    try {
      const response = await fetch('/api/balances')
      if (response.ok) {
        const data = await response.json()
        setBalances(data)
      }
    } catch (error) {
      console.error('Error fetching balances:', error)
    }
  }

  const filteredExpenses = selectedCategory === 'all'
    ? expenses
    : expenses.filter(expense => expense.category.id === selectedCategory)

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const splitExpenses = filteredExpenses.filter(expense => expense.isSplit)
  const myExpenses = filteredExpenses.filter(expense => expense.createdBy.email === session?.user?.email)

  const handleExpenseCreated = () => {
    fetchExpenses()
    fetchBalances()
    setIsExpenseFormOpen(false)
    toast.success('Expense created successfully!')
  }

  const handleBorrowLendCreated = () => {
    fetchBorrowLends()
    fetchBalances()
    setIsBorrowLendFormOpen(false)
    toast.success('Borrow/Lend record created successfully!')
  }

  const handleExpenseUpdated = () => {
    fetchExpenses()
    fetchBalances()
    toast.success('Expense updated successfully!')
  }

  const handleExpenseDeleted = () => {
    fetchExpenses()
    fetchBalances()
    toast.success('Expense deleted successfully!')
  }

  const handleBorrowLendUpdated = () => {
    fetchBorrowLends()
    fetchBalances()
    toast.success('Borrow/Lend record updated successfully!')
  }

  const handleBorrowLendDeleted = () => {
    fetchBorrowLends()
    fetchBalances()
    toast.success('Borrow/Lend record deleted successfully!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {session?.user?.name}!</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isExpenseFormOpen} onOpenChange={setIsExpenseFormOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <ExpenseForm
                  categories={categories}
                  onExpenseCreated={handleExpenseCreated}
                  onCategoryCreated={fetchCategories}
                />
              </DialogContent>
            </Dialog>
            <Dialog open={isBorrowLendFormOpen} onOpenChange={setIsBorrowLendFormOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Handshake className="w-4 h-4 mr-2" />
                  Borrow/Lend
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <BorrowLendForm
                  categories={categories}
                  onBorrowLendCreated={handleBorrowLendCreated}
                  onCategoryCreated={fetchCategories}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {filteredExpenses.length} expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Split Expenses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{splitExpenses.length}</div>
              <p className="text-xs text-muted-foreground">
                Shared with others
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Expenses</CardTitle>
              <TrendUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myExpenses.length}</div>
              <p className="text-xs text-muted-foreground">
                Created by you
              </p>
            </CardContent>
          </Card>

          <Link href="/balances">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">You Owe</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">₹{balances.totalOwed.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Click to manage
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/balances">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Owed to You</CardTitle>
                <ArrowDownLeft className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₹{balances.totalOwedToMe.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Click to manage
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by category:</span>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="borrow-lend">Borrow/Lend</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Trend</CardTitle>
                  <CardDescription>
                    Your spending over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseChart expenses={filteredExpenses} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>
                    Your latest transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseList
                    expenses={filteredExpenses.slice(0, 5)}
                    loading={loading}
                    compact={true}
                    onExpenseUpdated={handleExpenseUpdated}
                    onExpenseDeleted={handleExpenseDeleted}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>All Expenses</CardTitle>
                <CardDescription>
                  Complete list of your expenses and splits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseList
                  expenses={filteredExpenses}
                  loading={loading}
                  onExpenseUpdated={handleExpenseUpdated}
                  onExpenseDeleted={handleExpenseDeleted}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="borrow-lend">
            <Card>
              <CardHeader>
                <CardTitle>Borrow/Lend Records</CardTitle>
                <CardDescription>
                  Track money you've borrowed or lent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BorrowLendList
                  borrowLends={borrowLends}
                  loading={loading}
                  onBorrowLendUpdated={handleBorrowLendUpdated}
                  onBorrowLendDeleted={handleBorrowLendDeleted}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle>My Contacts</CardTitle>
                <CardDescription>
                  People you frequently split expenses with
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContactsList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                  <CardDescription>
                    Breakdown of expenses by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseChart expenses={filteredExpenses} type="category" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trend</CardTitle>
                  <CardDescription>
                    Your spending pattern over months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseChart expenses={filteredExpenses} type="monthly" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
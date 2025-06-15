import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name, color } = await request.json()

        if (!name) {
            return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
        }

        const category = await prisma.category.update({
            where: { id: params.id },
            data: {
                name,
                color: color || '#3B82F6',
            },
        })

        return NextResponse.json(category)
    } catch (error) {
        console.error('Error updating category:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if category is being used
        const expenseCount = await prisma.expense.count({
            where: { categoryId: params.id }
        })

        const borrowLendCount = await prisma.borrowLend.count({
            where: { categoryId: params.id }
        })

        if (expenseCount > 0 || borrowLendCount > 0) {
            return NextResponse.json({
                error: 'Cannot delete category that is being used by expenses or borrow/lend records'
            }, { status: 400 })
        }

        await prisma.category.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting category:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
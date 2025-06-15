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

        const { title, description, amount, categoryId } = await request.json()

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const expense = await prisma.expense.update({
            where: {
                id: params.id,
                createdById: user.id,
            },
            data: {
                title,
                description,
                amount: parseFloat(amount),
                categoryId,
            },
            include: {
                category: true,
                createdBy: {
                    select: { name: true, email: true }
                },
                participants: {
                    include: {
                        user: {
                            select: { name: true, email: true }
                        }
                    }
                }
            }
        })

        return NextResponse.json(expense)
    } catch (error) {
        console.error('Error updating expense:', error)
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

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        await prisma.expense.delete({
            where: {
                id: params.id,
                createdById: user.id,
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting expense:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
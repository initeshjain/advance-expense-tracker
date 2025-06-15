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

        const { title, description, amount, categoryId, type } = await request.json()

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const borrowLend = await prisma.borrowLend.update({
            where: {
                id: params.id,
                createdById: user.id,
            },
            data: {
                title,
                description,
                amount: parseFloat(amount),
                categoryId,
                type,
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

        return NextResponse.json(borrowLend)
    } catch (error) {
        console.error('Error updating borrow/lend record:', error)
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

        await prisma.borrowLend.delete({
            where: {
                id: params.id,
                createdById: user.id,
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting borrow/lend record:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
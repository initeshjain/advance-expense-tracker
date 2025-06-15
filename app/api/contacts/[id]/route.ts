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

        const { nickname } = await request.json()

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const contact = await prisma.contact.update({
            where: {
                id: params.id,
                savedById: user.id,
            },
            data: { nickname },
            include: {
                user: {
                    select: { id: true, name: true, email: true, image: true }
                }
            }
        })

        return NextResponse.json(contact)
    } catch (error) {
        console.error('Error updating contact:', error)
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

        await prisma.contact.delete({
            where: {
                id: params.id,
                savedById: user.id,
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting contact:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
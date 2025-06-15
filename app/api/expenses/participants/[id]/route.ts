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

        const { isPaid } = await request.json()

        const participant = await prisma.expenseParticipant.update({
            where: { id: params.id },
            data: { isPaid },
        })

        return NextResponse.json(participant)
    } catch (error) {
        console.error('Error updating expense participant:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
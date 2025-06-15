import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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

        const borrowLends = await prisma.borrowLend.findMany({
            where: {
                OR: [
                    { createdById: user.id },
                    { participants: { some: { userId: user.id } } }
                ]
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
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(borrowLends)
    } catch (error) {
        console.error('Error fetching borrow/lend records:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { title, description, amount, categoryId, type, participants } = await request.json()

        if (!title || !amount || !categoryId || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Create the borrow/lend record
        const borrowLend = await prisma.borrowLend.create({
            data: {
                title,
                description,
                amount: parseFloat(amount),
                categoryId,
                type,
                createdById: user.id,
            },
        })

        // Add participants
        if (participants && participants.length > 0) {
            for (const participant of participants) {
                let participantUser = await prisma.user.findUnique({
                    where: { email: participant.email }
                })

                if (!participantUser) {
                    // Create user without authentication data
                    participantUser = await prisma.user.create({
                        data: {
                            email: participant.email,
                            name: participant.nickname || participant.email.split('@')[0],
                            nickname: participant.nickname,
                        },
                    })
                }

                await prisma.borrowLendParticipant.create({
                    data: {
                        borrowLendId: borrowLend.id,
                        userId: participantUser.id,
                        amount: parseFloat(amount),
                        isSettled: false,
                    },
                })

                // Save as contact
                await prisma.contact.upsert({
                    where: {
                        savedById_userId: {
                            savedById: user.id,
                            userId: participantUser.id,
                        }
                    },
                    update: {
                        nickname: participant.nickname,
                    },
                    create: {
                        savedById: user.id,
                        userId: participantUser.id,
                        nickname: participant.nickname,
                    },
                })
            }
        }

        return NextResponse.json(borrowLend)
    } catch (error) {
        console.error('Error creating borrow/lend record:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
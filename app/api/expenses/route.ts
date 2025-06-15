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

    const expenses = await prisma.expense.findMany({
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

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, amount, categoryId, isSplit, participants } = await request.json()

    if (!title || !amount || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create the expense
    const expense = await prisma.expense.create({
      data: {
        title,
        description,
        amount: parseFloat(amount),
        categoryId,
        createdById: user.id,
        isSplit: Boolean(isSplit),
      },
    })

    // Handle split participants
    if (isSplit && participants && participants.length > 0) {
      const shareAmount = parseFloat(amount) / (participants.length + 1) // +1 for creator

      // Add other participants (creator is not added as participant in split expenses)
      for (const participant of participants) {
        let participantUser = await prisma.user.findUnique({
          where: { email: participant.email }
        })

        if (!participantUser) {
          // Create user if they don't exist
          participantUser = await prisma.user.create({
            data: {
              email: participant.email,
              name: participant.nickname || participant.email,
              nickname: participant.nickname,
            },
          })
        }

        await prisma.expenseParticipant.create({
          data: {
            expenseId: expense.id,
            userId: participantUser.id,
            shareAmount,
            isPaid: false,
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

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
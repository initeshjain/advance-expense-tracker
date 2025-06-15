import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
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

        // Get unpaid expense participants where user owes money
        const owedExpenses = await prisma.expenseParticipant.findMany({
            where: {
                userId: user.id,
                isPaid: false,
            },
            include: {
                expense: {
                    include: {
                        category: true,
                        createdBy: {
                            select: { name: true, email: true }
                        }
                    }
                }
            }
        })

        // Get expenses created by user where others owe money
        const owedToMeExpenses = await prisma.expenseParticipant.findMany({
            where: {
                expense: {
                    createdById: user.id
                },
                isPaid: false,
                userId: { not: user.id }
            },
            include: {
                expense: {
                    include: {
                        category: true,
                    }
                },
                user: {
                    select: { name: true, email: true }
                }
            }
        })

        // Get borrow/lend records where user is involved
        const borrowLends = await prisma.borrowLendParticipant.findMany({
            where: {
                OR: [
                    { userId: user.id, isSettled: false },
                    {
                        borrowLend: { createdById: user.id },
                        isSettled: false,
                        userId: { not: user.id }
                    }
                ]
            },
            include: {
                borrowLend: {
                    include: {
                        category: true,
                        createdBy: {
                            select: { name: true, email: true }
                        }
                    }
                },
                user: {
                    select: { name: true, email: true }
                }
            }
        })

        // Calculate totals
        // Total amount the user owes to others
        const totalOwed =
            // From expense shares
            owedExpenses.reduce((sum, p) => sum + p.shareAmount, 0) +

            // From borrow/lend records where someone lent to the user
            borrowLends
                .filter(bl =>
                    // Someone else created a LEND or BORROW record, and the user is a participant
                    bl.userId === user.id &&
                    (bl.borrowLend.type === 'LEND' || bl.borrowLend.type === 'BORROW')
                )
                .reduce((sum, bl) => sum + bl.amount, 0);

        // Total amount others owe the user
        const totalOwedToMe =
            // From expense shares
            owedToMeExpenses.reduce((sum, p) => sum + p.shareAmount, 0) +

            // From borrow/lend records the user created for others
            borrowLends
                .filter(bl =>
                    // The user created the LEND or BORROW, and the participant is someone else
                    bl.borrowLend.createdById === user.id &&
                    bl.userId !== user.id &&
                    (bl.borrowLend.type === 'LEND' || bl.borrowLend.type === 'BORROW')
                )
                .reduce((sum, bl) => sum + bl.amount, 0);


        return NextResponse.json({
            totalOwed,
            totalOwedToMe,
            owedExpenses,
            owedToMeExpenses,
            borrowLends
        })
    } catch (error) {
        console.error('Error fetching balances:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
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

    const contacts = await prisma.contact.findMany({
      where: { savedById: user.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, nickname } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find or create the contact user
    let contactUser = await prisma.user.findUnique({
      where: { email }
    })

    if (!contactUser) {
      contactUser = await prisma.user.create({
        data: {
          email,
          name: nickname || email,
          nickname,
        },
      })
    }

    // Create or update contact
    const contact = await prisma.contact.upsert({
      where: {
        savedById_userId: {
          savedById: user.id,
          userId: contactUser.id,
        }
      },
      update: {
        nickname,
      },
      create: {
        savedById: user.id,
        userId: contactUser.id,
        nickname,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
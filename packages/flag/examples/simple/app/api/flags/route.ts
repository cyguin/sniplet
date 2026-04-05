import { NextRequest, NextResponse } from 'next/server'

const mockFlags = [
  {
    name: 'new-checkout',
    enabled: true,
    rolloutPercentage: 100,
    userIds: [],
  },
  {
    name: 'beta-dashboard',
    enabled: false,
    rolloutPercentage: 10,
    userIds: [],
  },
  {
    name: 'dark-mode',
    enabled: true,
    rolloutPercentage: 100,
    userIds: ['user-123', 'user-456'],
  },
]

export async function GET() {
  return NextResponse.json(mockFlags)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, config } = body

    if (!name || !config) {
      return NextResponse.json(
        { error: 'Missing name or config' },
        { status: 400 }
      )
    }

    const existingIndex = mockFlags.findIndex((f) => f.name === name)

    if (existingIndex >= 0) {
      mockFlags[existingIndex] = {
        ...mockFlags[existingIndex],
        ...config,
      }
    } else {
      mockFlags.push({
        name,
        enabled: config.enabled ?? false,
        rolloutPercentage: config.rolloutPercentage ?? 100,
        userIds: config.userIds ?? [],
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to set flag' },
      { status: 500 }
    )
  }
}
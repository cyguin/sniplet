import { NextRequest, NextResponse } from 'next/server'
import { getDb, setFlagDb, deleteFlagDb, getAllFlagsDb } from '../../lib/db-client'
import type { FlagConfig } from '../../types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  
  try {
    if (name) {
      const flag = await getDb(name)
      if (!flag) {
        return NextResponse.json({ error: 'Flag not found' }, { status: 404 })
      }
      return NextResponse.json(flag)
    }
    
    const flags = await getAllFlagsDb()
    return NextResponse.json(flags)
  } catch (error) {
    console.error('GET flags error:', error)
    return NextResponse.json({ error: 'Failed to fetch flags' }, { status: 500 })
  }
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
    
    const flagConfig: FlagConfig = {
      enabled: config.enabled,
      rolloutPercentage: config.rolloutPercentage,
      userIds: config.userIds,
    }
    
    await setFlagDb(name, flagConfig)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST flags error:', error)
    return NextResponse.json({ error: 'Failed to set flag' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  
  if (!name) {
    return NextResponse.json(
      { error: 'Missing flag name' }, 
      { status: 400 }
    )
  }
  
  try {
    await deleteFlagDb(name)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE flags error:', error)
    return NextResponse.json({ error: 'Failed to delete flag' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server';
import type { UserProfile } from '@/lib/types/user';

// This would typically come from your database
const mockUserProfiles: Record<string, UserProfile> = {
  'default': {
    id: 'default',
    email: 'user@example.com',
    subscriptionPlan: 'free',
    monthlyQrCount: 0,
    lastQrResetDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // In a real application, you would fetch this from your database
    const userProfile = mockUserProfiles[params.id] || mockUserProfiles['default'];
    
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // In a real application, you would update this in your database
    const updatedProfile = {
      ...mockUserProfiles[params.id] || mockUserProfiles['default'],
      ...body,
      id: params.id,
      updatedAt: new Date().toISOString()
    };
    
    mockUserProfiles[params.id] = updatedProfile;
    
    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
} 
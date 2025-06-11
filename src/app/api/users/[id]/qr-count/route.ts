import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Query QR codes created this month
    const qrCodesRef = collection(db, 'qrcodes');
    const q = query(
      qrCodesRef,
      where('userId', '==', userId),
      where('createdAt', '>=', Timestamp.fromDate(startOfMonth))
    );
    
    const querySnapshot = await getDocs(q);
    const count = querySnapshot.size;
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching QR count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QR count' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getSubmissions } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    const secretKey = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || 'Jothi@24680';
    const enterKey = process.env.NEXT_PUBLIC_ADMIN_ENTER_KEY || 'Googlesetup24680';

    // Validate authorization key
    if (authHeader !== secretKey && authHeader !== enterKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized key' },
        { status: 401 }
      );
    }

    // Retrieve database records
    const submissions = await getSubmissions();

    return NextResponse.json({
      success: true,
      submissions
    });

  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message || 'Failed to retrieve database submissions.'
      },
      { status: 500 }
    );
  }
}

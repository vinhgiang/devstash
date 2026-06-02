import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSearchableData } from '@/lib/db/search';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await getSearchableData(session.user.id);
  return NextResponse.json(data);
}

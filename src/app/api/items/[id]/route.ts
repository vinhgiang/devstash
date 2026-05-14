import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getItemDetail } from '@/lib/db/items';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const item = await getItemDetail(session.user.id, id);
  if (!item) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json(item);
}

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { appConfig } from '@/lib/config';

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth');

  // Redirect to first page in config, or dashboard
  const firstPage = appConfig.pages[0]?.route || '/dashboard';
  redirect(firstPage);
}

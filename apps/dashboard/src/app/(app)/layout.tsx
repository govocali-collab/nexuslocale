import { redirect } from 'next/navigation';
import { getUser }   from '@/lib/supabase/server';
import { Sidebar }   from '@/components/layout/sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/login');

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[#EEEDF8] p-6">
        {children}
      </main>
    </div>
  );
}

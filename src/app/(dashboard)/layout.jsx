import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TopNav from '@/components/layout/TopNav';
import DndProvider from '@/components/providers/DndProvider';
import BrainChat from '@/features/AgenticHub/components/BrainChatLoader';

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const sessionUser = { id: user.id, email: user.email };

  return (
    <DndProvider>
      <TopNav user={sessionUser} />
      <main
        className="pt-16 flex-1 bg-surface transition-all view-enter overflow-x-hidden overflow-y-auto"
        style={{ height: '100vh' }}
        id="main-content"
      >
        {children}
      </main>
      <BrainChat />
    </DndProvider>
  );
}

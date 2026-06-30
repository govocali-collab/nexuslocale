import { getProspects } from '@/lib/queries';
import { listMessages } from '@/lib/sms-actions';
import { MessagesView } from '@/components/messages/messages-view';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const [prospects, messages] = await Promise.all([getProspects(), listMessages()]);
  const contacts = prospects
    .filter((p) => p.phone)
    .map((p) => ({ id: p.id, name: p.business_name, phone: p.phone as string }));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-[#0a0a0a]">Messages</h1>
      <MessagesView contacts={contacts} messages={messages} />
    </div>
  );
}

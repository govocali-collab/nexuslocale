import { getProspects } from '@/lib/queries';
import { getCallScript } from '@/lib/settings-actions';
import { KanbanBoard } from '@/components/pipeline/kanban-board';
import { AddProspectButton } from '@/components/pipeline/add-prospect-button';

export default async function PipelinePage() {
  const [prospects, callScript] = await Promise.all([getProspects(), getCallScript()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-[#0a0a0a]">
          Pipeline{' '}
          <span className="text-[#a3a3a3] text-base font-normal ml-1">
            ({prospects.length} prospect{prospects.length !== 1 ? 's' : ''})
          </span>
        </h1>
        <AddProspectButton />
      </div>

      <KanbanBoard prospects={prospects} initialScript={callScript} />
    </div>
  );
}

import { getProspects } from '@/lib/queries';
import { KanbanBoard } from '@/components/pipeline/kanban-board';

export default async function PipelinePage() {
  const prospects = await getProspects();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[#1C1560]">
          Pipeline{' '}
          <span className="text-[#9A97C0] text-base font-normal ml-1">
            ({prospects.length} prospect{prospects.length !== 1 ? 's' : ''})
          </span>
        </h1>
      </div>

      <KanbanBoard prospects={prospects} />
    </div>
  );
}

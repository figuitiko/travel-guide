import { PlannerWizard } from '@/components/planner/planner-wizard';
import { createTravelRequest, generateTripRecommendations } from '@/app/actions';
export default function PlanPage() { return <div className="mx-auto max-w-3xl px-5 py-10"><h1 className="text-4xl font-black">Plan your possible trip</h1><p className="mt-3 text-stone-600">Four quick steps. Then we generate three comparable options.</p><div className="card mt-8 p-5 md:p-8"><PlannerWizard onCreateRequest={createTravelRequest} onGenerate={generateTripRecommendations} /></div></div>; }

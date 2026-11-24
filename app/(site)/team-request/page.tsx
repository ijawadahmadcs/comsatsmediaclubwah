import EventRequestForm from "@/components/EventRequestForm";
import PublicPageHeader from "@/components/PublicPageHeader";
import { CalendarCheck } from "lucide-react";

const TeamRequest = () => {
  return (
    <div className="mx-auto max-w-7xl px-3 pt-24 sm:px-5 sm:pt-28 lg:px-8">
      <PublicPageHeader
        eyebrow="Event coverage"
        title="Bring us your next event"
        highlightedTitle="your next event."
        description="Submit an organized media coverage request for photography, videography, or both."
        icon={CalendarCheck}
      />
      <EventRequestForm />
    </div>
  )
}
export default TeamRequest

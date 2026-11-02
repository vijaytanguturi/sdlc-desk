import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export function NotFoundPage() {
  return (
    <EmptyState
      icon={<Compass size={22} />}
      title="That page does not exist"
      description="The link may be outdated. Return to the dashboard or open one of the tools from the sidebar."
      action={
        <Link className="btn btn--primary" to="/">
          Back to dashboard
        </Link>
      }
    />
  );
}

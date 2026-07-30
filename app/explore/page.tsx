import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';

export default function ExplorePage() {
  return (
    <MobileShell>
      <div className="flex items-center px-5 pt-2 pb-3 flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">Explore</h1>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 pb-16">
        <span className="text-5xl">🌐</span>
        <p className="text-gray-500 text-sm text-center">Destination discovery<br/>coming soon.</p>
      </div>
      <BottomNav />
    </MobileShell>
  );
}

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PairCard } from "@/components/ui/PairCard";
import { FlipDemo, RaceDemo } from "./Demo";

export const metadata = { title: "Components · Club Duel" };

export default function ComponentsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <h1 className="text-3xl font-bold tracking-tight">Club Duel components</h1>
      <p className="mt-1 max-w-prose text-ink-soft">
        Base components. All names on this page are synthetic demo data.
      </p>

      <div className="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        <RaceDemo />
        <FlipDemo />

        <Card title="Buttons">
          <div className="flex flex-wrap gap-2">
            <Button>Submit lineup</Button>
            <Button variant="secondary">Unsubmit</Button>
            <Button variant="ghost">Copy link</Button>
            <Button disabled>Open Round 3</Button>
          </div>
        </Card>

        <Card title="Badges">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="warn" />
            <Badge tone="live">Live · Court 2</Badge>
            <Badge mark="filled">Submitted</Badge>
            <Badge mark="hollow">Not yet</Badge>
            <Badge>Pending</Badge>
          </div>
        </Card>

        <Card title="Pair cards" className="md:col-span-2">
          <div className="-mx-4 grid grid-cols-1 divide-y divide-line border-y border-line last:border-b-0 sm:-mx-5 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            <PairCard side="A" slot={1} names={["Ana Cruz", "Ben Lim"]} />
            <PairCard side="A" slot={2} names={["Eli Go", "Fay Ong"]} repeat />
            <PairCard side="B" slot={3} names={null} />
            <PairCard side="B" slot={4} names={null} />
          </div>
        </Card>
      </div>
    </main>
  );
}

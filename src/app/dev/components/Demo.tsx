"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PairCard } from "@/components/ui/PairCard";
import { ScoreRace } from "@/components/ui/ScoreRace";

// Synthetic demo data only.
export function RaceDemo() {
  const [t, setT] = useState({ a: 112, b: 104 });
  return (
    <div className="flex flex-col gap-3">
      <ScoreRace a={{ name: "Riverside PC", total: t.a }} b={{ name: "Northgate PC", total: t.b }} status="Round 2 · 3 of 7 matches done" />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setT({ a: t.a + 11, b: t.b + 7 })}>
          Riverside win 11–7
        </Button>
        <Button variant="secondary" onClick={() => setT({ a: t.a + 4, b: t.b + 11 })}>
          Northgate win 11–4
        </Button>
        <Button variant="ghost" onClick={() => setT({ a: 0, b: 0 })}>
          Reset to 0–0
        </Button>
      </div>
    </div>
  );
}

export function FlipDemo() {
  const [started, setStarted] = useState(false);
  const [run, setRun] = useState(0);
  return (
    <Card
      title="Match 4"
      action={
        started ? (
          <Button variant="ghost" onClick={() => { setStarted(false); setRun(run + 1); }}>
            Reset
          </Button>
        ) : (
          <Button onClick={() => setStarted(true)}>Start on Court 1</Button>
        )
      }
    >
      <div key={run} className="-mx-4 grid grid-cols-[1fr_auto_1fr] border-y border-line last:border-b-0 sm:-mx-5">
        <PairCard side="A" slot={4} names={started ? ["Mara Villa", "Noel Ramos"] : null} />
        <span className="flex items-center px-2 text-xs font-semibold text-ink-soft">vs</span>
        <PairCard side="B" slot={4} names={started ? ["Olga Pineda", "Paul Chua"] : null} repeat />
      </div>
    </Card>
  );
}

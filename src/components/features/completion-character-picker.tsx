"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CompletionScene,
  CHARACTERS,
  getStoredCharacter,
  setStoredCharacter,
  type CharacterId,
} from "@/components/features/completion-scene";

/** Settings card: pick which companion appears on the "All caught up" screen. */
export function CompletionCharacterPicker() {
  const [selected, setSelected] = React.useState<CharacterId>("aria");

  React.useEffect(() => setSelected(getStoredCharacter()), []);

  function choose(id: CharacterId) {
    setSelected(id);
    setStoredCharacter(id);
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-base">Completion Companion</CardTitle>
        <CardDescription>
          Pick who keeps you company on the &quot;All caught up&quot; screen when your queue is clear.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Large live preview */}
        <div className="mb-4 flex items-center justify-center rounded-2xl border border-border bg-canvas py-4">
          <CompletionScene characterId={selected} className="h-36 w-auto max-w-[260px]" />
        </div>

        {/* Choices */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {(Object.keys(CHARACTERS) as CharacterId[]).map((id) => {
            const isActive = selected === id;
            return (
              <button
                key={id}
                onClick={() => choose(id)}
                className={`relative flex flex-col items-center gap-1 rounded-xl border p-2 transition-colors ${
                  isActive ? "border-state-today bg-state-today/5" : "border-border hover:bg-canvas"
                }`}
                aria-pressed={isActive}
              >
                <CompletionScene characterId={id} className="h-14 w-auto" />
                <span className="text-xs font-medium text-forest-slate">{CHARACTERS[id].name}</span>
                {isActive && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-state-today text-white">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

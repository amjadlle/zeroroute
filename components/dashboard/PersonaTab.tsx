"use client";

import { useState } from "react";
import { Check, Sparkles, Sliders } from "lucide-react";

interface PersonaTabProps {
  initialBotTitle: string;
  initialBotRole: string;
  initialTone: string;
  initialGreeting: string;
  initialPersona: string;
  onSave: (data: {
    bot_title: string;
    bot_role: string;
    tone: string;
    greeting: string;
    persona: string;
  }) => Promise<void>;
  saving: boolean;
}

export function PersonaTab({
  initialBotTitle,
  initialBotRole,
  initialTone,
  initialGreeting,
  initialPersona,
  onSave,
  saving,
}: PersonaTabProps) {
  const [botTitle, setBotTitle] = useState(initialBotTitle);
  const [botRole, setBotRole] = useState(initialBotRole);
  const [tone, setTone] = useState(initialTone);
  const [greeting, setGreeting] = useState(initialGreeting);
  const [persona, setPersona] = useState(initialPersona);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ bot_title: botTitle, bot_role: botRole, tone, greeting, persona });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="w-full bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-red-400" />
            <span>Tune Assistant Persona</span>
          </h3>
          <p className="text-xs text-slate-400">
            Configure how your assistant introduces itself, speaks, greets visitors, and handles inquiries across all embeds.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-4 h-4 shrink-0" />
          <span className="font-semibold">Persona settings saved and synchronized successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Bot Display Title</label>
            <input
              type="text"
              value={botTitle}
              onChange={(e) => setBotTitle(e.target.value)}
              placeholder="e.g. Mapki AI"
              className="w-full bg-[#080a0f] border border-dark-border rounded-xl px-4 py-2.5 text-base sm:text-xs text-white placeholder-slate-600 focus:border-red-500/50 outline-none transition-all touch-manipulation"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Conversational Tone</label>
            <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="e.g. helpful, friendly, and concise"
              className="w-full bg-[#080a0f] border border-dark-border rounded-xl px-4 py-2.5 text-base sm:text-xs text-white placeholder-slate-600 focus:border-red-500/50 outline-none transition-all touch-manipulation"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Assistant Role / Specialty</label>
            <input
              type="text"
              value={botRole}
              onChange={(e) => setBotRole(e.target.value)}
              placeholder="e.g. AI Customer Support Specialist"
              className="w-full bg-[#080a0f] border border-dark-border rounded-xl px-4 py-2.5 text-base sm:text-xs text-white placeholder-slate-600 focus:border-red-500/50 outline-none transition-all touch-manipulation"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Welcome Greeting</label>
            <input
              type="text"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="e.g. Hi there! How can I help you today?"
              className="w-full bg-[#080a0f] border border-dark-border rounded-xl px-4 py-2.5 text-base sm:text-xs text-white placeholder-slate-600 focus:border-red-500/50 outline-none transition-all touch-manipulation"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">Custom System Persona Instructions</label>
            <span className="text-[11px] text-slate-500 font-mono">Dynamic RAG Prompt</span>
          </div>
          <textarea
            rows={7}
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            placeholder="Provide specific instructions on how the assistant should respond, handle inquiries, qualify leads, and enforce brand guidelines."
            className="w-full bg-[#080a0f] border border-dark-border rounded-xl p-4 text-base sm:text-xs text-white font-mono leading-relaxed placeholder-slate-600 focus:border-red-500/50 outline-none transition-all resize-y touch-manipulation"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 min-h-[44px] rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-500/20 active:scale-95 cursor-pointer transition-all disabled:opacity-70 flex items-center justify-center gap-2 touch-manipulation"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Persona…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Save Persona Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

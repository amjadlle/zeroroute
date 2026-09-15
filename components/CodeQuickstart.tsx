export function CodeQuickstart() {
  return (
    <section id="quickstart" className="space-y-8 scroll-mt-20 max-w-4xl mx-auto">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-white">Drop-in OpenAI Replacement</h2>
        <p className="text-sm text-slate-400">
          Works seamlessly with OpenAI SDK, LangChain, LlamaIndex, Cursor, or direct cURL
        </p>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-dark-border">
          <span className="font-mono text-slate-300">python / nodejs / curl</span>
          <span className="text-red-400 font-mono text-[11px]">base_url: https://zeroroute.mapki.in/v1</span>
        </div>

        <pre className="font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto p-4 bg-[#080a0f] rounded-xl border border-dark-border">
          <code>
            <span className="text-slate-500"># Python Example (Use official openai library with ZeroRoute)</span>{"\n"}
            <span className="text-purple-400">from</span> openai <span className="text-purple-400">import</span> OpenAI{"\n\n"}
            client = OpenAI({"\n"}
            {"    "}base_url=<span className="text-emerald-300">&quot;https://zeroroute.mapki.in/v1&quot;</span>,{"\n"}
            {"    "}api_key=<span className="text-amber-300">&quot;your-router-key&quot;</span>{"\n"}
            ){"\n\n"}
            response = client.chat.completions.create({"\n"}
            {"    "}model=<span className="text-emerald-300">&quot;default&quot;</span>,  <span className="text-slate-500"># Auto-routes across 11 AI clouds with zero downtime!</span>{"\n"}
            {"    "}messages=[&#123;<span className="text-emerald-300">&quot;role&quot;</span>: <span className="text-emerald-300">&quot;user&quot;</span>, <span className="text-emerald-300">&quot;content&quot;</span>: <span className="text-emerald-300">&quot;Hello!&quot;</span>&#125;]{"\n"}
            ){"\n\n"}
            <span className="text-cyan-400">print</span>(response.choices[0].message.content)
          </code>
        </pre>
      </div>
    </section>
  );
}

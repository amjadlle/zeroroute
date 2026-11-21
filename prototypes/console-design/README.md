# PROTOTYPE: console design directions (throwaway)

Question: which theme, accent and shell structure should the redesigned admin and customer consoles use? (#1, spec #47)

Five directions (Graphite+ is the recommended mix: Graphite shell, Daylight setup checklist for new customers, Harbor-style next-step card for live ones), switchable with the floating bar or the ← → keys; each has three accents and light/dark:

| Direction | Shell | Home hierarchy | Type |
|---|---|---|---|
| Graphite | dense sidebar + Ctrl K command bar | KPI strip, recent conversations, needs-attention list | Geist |
| Daylight | top nav, roomy | guided setup checklist + plan/key inspector | Plus Jakarta Sans (current brand font) |
| Monolith | icon rail + context panel, monochrome; accent only for focus/active/charts | one giant number, 30-day chart, activity timeline | Instrument Sans |
| Harbor | floating rounded dock, mobile bottom tabs, pill controls | friendly greeting + one suggested next step | Bricolage Grotesque + Figtree |

Live: https://claude.ai/artifact/H9Y3WnTzJUZ5VQ5LEp1vZR (private to the owner). Open `index.html` by wrapping it in a doctype, or view the artifact.

Not for main. Once a direction wins, fold the decision into the tokens PR (#56) and the component tickets; this branch stays as the primary source.

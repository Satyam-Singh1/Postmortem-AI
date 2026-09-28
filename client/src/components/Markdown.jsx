import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders model output as rich markdown using Tailwind Typography (prose).
export default function Markdown({ children }) {
  return (
    <div
      className="prose prose-invert max-w-none
        prose-headings:font-semibold prose-headings:text-slate-100
        prose-h3:text-base prose-h3:text-indigo-300 prose-h3:mt-5
        prose-p:text-slate-300 prose-strong:text-white
        prose-li:text-slate-300 prose-li:marker:text-indigo-400
        prose-code:rounded prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5
        prose-code:text-indigo-200 prose-code:before:content-[''] prose-code:after:content-['']
        prose-a:text-indigo-300"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

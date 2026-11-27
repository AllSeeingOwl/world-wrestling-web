import React from 'react';
import { sectionStyle } from '../utils/sections.js';

const ArticleCard = ({ article }) => {
  const style = sectionStyle(article.registry_section);
  const formattedDate = (() => {
    try {
      return new Date(article.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
    } catch {
      return article.date;
    }
  })();

  return (
    <article
      className={`h-full flex flex-col bg-registry-surface border border-registry-border border-l-4 ${style.stripe} p-6 hover:ring-1 hover:ring-registry-textMuted transition-shadow focus-within:ring-2 focus-within:ring-registry-text focus-within:ring-offset-2 focus-within:ring-offset-registry-background rounded-lg`}
    >
      {/* The section's colour and name, then its significance in the same colour. */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px] font-semibold">
        <span className={`px-2 py-0.5 rounded uppercase tracking-wider ${style.chip}`}>
          {style.short}
        </span>
        {/* Homage & Influence has one type of significance, named like the section itself. */}
        {article.significance !== style.short && (
          <span className={style.text}>{article.significance}</span>
        )}
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-start gap-2 mb-4">
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-bold text-registry-text mb-1 group-hover:underline underline-offset-4">
            {article.title}
          </h2>
          {article.event_name && (
            <p className="text-xs text-registry-textMuted font-medium mb-1">{article.event_name}</p>
          )}
        </div>
        <span className="bg-registry-background border border-registry-border text-registry-textMuted text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider text-center max-w-full sm:max-w-[45%]">
          {article.promotion}
        </span>
      </div>

      <div className="text-xs font-mono text-registry-textMuted mb-4 flex flex-col gap-1">
        <span>
          <time dateTime={article.date}>{formattedDate}</time>
          {article.era && ` • ${article.era}`}
        </span>
        {article.parts > 1 && <span>Composite work · {article.parts} parts</span>}
        {article.wrestlers_involved && article.wrestlers_involved.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            <span className="font-sans font-semibold text-registry-textMuted">People:</span>
            {article.wrestlers_involved.map((wrestler, idx) => (
              <span
                key={idx}
                className="bg-registry-background text-registry-text text-[11px] px-1.5 py-0.5 rounded border border-registry-border font-sans"
              >
                {wrestler}
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm font-sans text-registry-text mt-auto line-clamp-3">{article.summary}</p>
    </article>
  );
};

export default ArticleCard;

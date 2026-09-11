import React from 'react';

const ArticleCard = ({ article }) => {
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
    <article className="h-full flex flex-col bg-registry-surface border border-registry-border p-6 hover:border-registry-gold transition-colors focus-within:ring-2 focus-within:ring-registry-gold focus-within:ring-offset-2 focus-within:ring-offset-registry-background rounded-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-heading text-xl font-bold text-registry-text mb-1 group-hover:text-registry-gold transition-colors">
            {article.title}
          </h3>
          {article.event_name && (
            <p className="text-xs text-registry-gold font-medium mb-1">{article.event_name}</p>
          )}
        </div>
        <span className="bg-registry-gold text-registry-background text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider text-center shrink-0 ml-2">
          {article.promotion}
        </span>
      </div>

      <div className="text-xs font-mono text-registry-textMuted mb-4 flex flex-col gap-1">
        <span>
          <time dateTime={article.date}>{formattedDate}</time>
          {article.era && article.era !== 'Unknown' && ` • ${article.era}`}
          {` • ${article.significance}`}
        </span>
        <span>
          <strong>Section:</strong> {article.registry_section}
        </span>
        {article.wrestlers_involved && article.wrestlers_involved.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            <span className="font-sans font-semibold text-registry-textMuted">Wrestlers:</span>
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

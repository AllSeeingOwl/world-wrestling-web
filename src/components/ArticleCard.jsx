import React from 'react';

const ArticleCard = ({ article }) => {
  return (
    <article className="h-full flex flex-col bg-registry-surface border border-registry-border p-6 hover:border-registry-gold transition-colors focus-within:ring-2 focus-within:ring-registry-gold focus-within:ring-offset-2 focus-within:ring-offset-registry-background rounded-lg">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-heading text-xl font-bold text-registry-text mb-2 group-hover:text-registry-gold transition-colors">
          {article.title}
        </h3>
        <span className="bg-registry-gold text-registry-background text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider text-center shrink-0 ml-2">
          {article.promotion}
        </span>
      </div>

      <div className="text-xs font-mono text-registry-textMuted mb-4 flex flex-col gap-1">
        <span>
          <time dateTime={new Date(article.date).toISOString()}>
            {new Date(article.date).toLocaleDateString()}
          </time>{' '}
          &bull; Significance: {article.significance}
        </span>
        <span>
          <strong>Section:</strong> {article.registry_section}
        </span>
      </div>

      <p className="text-sm font-sans text-registry-text mt-auto line-clamp-3">{article.summary}</p>
    </article>
  );
};

export default ArticleCard;

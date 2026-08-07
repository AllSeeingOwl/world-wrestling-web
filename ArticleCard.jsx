import React from 'react';

const ArticleCard = ({ article }) => {
  return (
    <article className="h-full flex flex-col bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow rounded-lg">
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded uppercase tracking-wider">
          {article.registry_section}
        </span>
      </div>
      
      <h3 className="font-bold text-lg text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
        {article.title}
      </h3>
      
      <div className="text-xs text-slate-500 mb-4 flex flex-col gap-1">
        <span><strong>Date:</strong> {article.date}</span>
        <span><strong>Promotion:</strong> {article.promotion}</span>
      </div>
      
      <p className="text-sm text-slate-700 mt-auto line-clamp-3">
        {article.summary}
      </p>
    </article>
  );
};

export default ArticleCard;

import React, { useState, useMemo } from 'react'; import FavoriteButton from './FavoriteButton'; import { useFavorites } from '../hooks/useFavorites';
export default function SummaryList({ allSummaries, page = 'home' }) {
  const [searchTerm, setSearchTerm] = useState(''); const [selectedCategory, setSelectedCategory] = useState('All'); const { favorites } = useFavorites();
  const categories = ['All', ...new Set(allSummaries.map(s => s.data.category))];
  const filteredSummaries = useMemo(() => {
    let summaries = page === 'favorites' ? allSummaries.filter(s => favorites.includes(s.slug)) : allSummaries;
    if (selectedCategory !== 'All') { summaries = summaries.filter(s => s.data.category === selectedCategory); }
    if (searchTerm) { summaries = summaries.filter(s => s.data.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.data.author.toLowerCase().includes(searchTerm.toLowerCase())); }
    return summaries;
  }, [allSummaries, searchTerm, selectedCategory, page, favorites]);
  return (
    <div>
      {page === 'home' && (
        <div className="summary-controls">
          <input type="text" placeholder="Search by title or author..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <div className="category-filters">{categories.map(cat => (<button key={cat} className={selectedCategory === cat ? 'active' : ''} onClick={() => setSelectedCategory(cat)}>{cat}</button>))}</div>
        </div>
      )}
      {filteredSummaries.length > 0 ? (
        <div className="summary-grid">{filteredSummaries.map(s => (
          <div key={s.slug} className="summary-card">
            <div><h2>{s.data.title}</h2><p className="card-meta">By {s.data.author} • {s.data.category}</p><p>{s.data.description}</p></div>
            <div className="card-actions"><a href={`/summaries/${s.slug}/`} className="read-more">Read More →</a><FavoriteButton slug={s.slug} /></div>
          </div>
        ))}</div>
      ) : (<p>No summaries found. Try adjusting your filters!</p>)}
    </div>
  );
}
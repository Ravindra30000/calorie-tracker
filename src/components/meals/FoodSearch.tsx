'use client';
import { useState } from 'react';
import { FoodItem } from '@/lib/types';

interface FoodSearchProps {
  onSelect: (item: FoodItem) => void;
}

export function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.items || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Search food..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      {results.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, maxHeight: 200, overflowY: 'auto' }}>
          {results.map((item) => (
            <li
              key={item.id}
              style={{
                padding: 8,
                marginBottom: 4,
                border: '1px solid #ddd',
                borderRadius: 4,
                cursor: 'pointer',
              }}
              onClick={() => onSelect(item)}
            >
              <strong>{item.name}</strong>
              {item.brand && <span> ({item.brand})</span>}
              <br />
              <small>
                {item.calories} kcal
                {item.serving_size && ` per ${item.serving_size}`}
              </small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


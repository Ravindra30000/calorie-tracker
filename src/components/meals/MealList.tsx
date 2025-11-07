'use client';
import { Meal } from '@/lib/types';
import { format } from 'date-fns';
import Link from 'next/link';

interface MealListProps {
  meals: Meal[];
}

export function MealList({ meals }: MealListProps) {
  if (meals.length === 0) {
    return <p>No meals found.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {meals.map((meal) => (
        <li
          key={meal.id}
          style={{
            padding: 16,
            marginBottom: 8,
            border: '1px solid #ddd',
            borderRadius: 4,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h3 style={{ margin: 0 }}>{meal.name || 'Meal'}</h3>
              <p style={{ margin: '4px 0', color: '#666' }}>
                {format(new Date(meal.meal_time), 'MMM d, yyyy h:mm a')}
              </p>
              {meal.notes && <p style={{ margin: '4px 0' }}>{meal.notes}</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>{meal.total_calories || 0} kcal</strong>
            </div>
          </div>
          <Link href={`/meals/${meal.id}`} style={{ marginTop: 8, display: 'inline-block' }}>
            View Details →
          </Link>
        </li>
      ))}
    </ul>
  );
}


'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/layout/Navbar';

export default function VoiceMealPage() {
  const router = useRouter();
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('Meal');
  const [mealTime, setMealTime] = useState(new Date().toISOString());
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        setIsListening(false);
        processVoiceInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          alert('No speech detected. Please try again.');
        } else {
          alert('Speech recognition error. Please try again.');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else if (typeof window !== 'undefined' && 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        setIsListening(false);
        processVoiceInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        alert('Speech recognition error. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  function startListening() {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    setTranscript('');
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      setIsListening(false);
    }
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }

  async function processVoiceInput(text: string) {
    setProcessing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      // Call AI to parse voice input and extract food items
      const res = await fetch('/api/ai/parse-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuggestions(data.items || []);
      } else {
        alert(data.error || 'Failed to process voice input');
      }
    } catch (error) {
      alert('Failed to process voice input');
    } finally {
      setProcessing(false);
    }
  }

  function addItem(item: any) {
    setSelectedItems(prev => [...prev, { ...item, quantity: 1 }]);
  }

  function removeItem(index: number) {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  }

  function updateQuantity(index: number, quantity: number) {
    if (quantity <= 0) return;
    setSelectedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ));
  }

  async function saveMeal() {
    if (selectedItems.length === 0) return;
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const body = {
        name,
        meal_time: mealTime,
        items: selectedItems.map(it => ({
          food_item_id: it.id || null,
          custom_name: it.name || null,
          quantity: it.quantity || 1,
          unit: it.serving_size || 'serving',
          calories: it.calories || 0,
          protein: it.protein || 0,
          carbs: it.carbs || 0,
          fat: it.fat || 0,
        })),
      };

      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        router.push('/dashboard');
      } else {
        alert(data.error || 'Failed to save meal');
      }
    } catch (error) {
      alert('Failed to save meal');
    } finally {
      setSaving(false);
    }
  }

  const totalCalories = selectedItems.reduce((sum, item) => {
    const baseCal = Number(item.calories) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + (baseCal * qty);
  }, 0);

  const isSupported = typeof window !== 'undefined' && 
    (('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window));

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold mb-6"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <h1 className="text-4xl font-bold text-gray-900 mb-8">Log Meal with Voice</h1>

          {!isSupported && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl mb-6">
              <p className="text-yellow-800">
                Voice recognition is not supported in your browser. Please use Chrome or Edge for the best experience.
              </p>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 card-hover animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Meal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  value={new Date(mealTime).toISOString().slice(0, 16)}
                  onChange={e => setMealTime(new Date(e.target.value).toISOString())}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Voice Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-4">Voice Input</label>
              <div className="text-center">
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={!isSupported || processing}
                  className={`w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'gradient-primary hover:shadow-2xl'
                  } disabled:opacity-50`}
                >
                  {isListening ? (
                    <>
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                      </svg>
                    </>
                  ) : (
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                  )}
                </button>
                <p className="mt-4 text-gray-600">
                  {isListening ? 'Listening... Speak now' : 'Tap to start recording'}
                </p>
                {transcript && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-700 italic">"{transcript}"</p>
                  </div>
                )}
                {processing && (
                  <p className="mt-2 text-orange-600">Processing your voice input...</p>
                )}
              </div>
            </div>

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recognized Foods</h3>
                <div className="space-y-2">
                  {suggestions.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-600">
                          {item.calories} kcal {item.serving_size && `per ${item.serving_size}`}
                        </div>
                      </div>
                      <button
                        onClick={() => addItem(item)}
                        className="px-4 py-2 gradient-primary text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 card-hover animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Selected Items</h2>
              <div className="space-y-4">
                {selectedItems.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-50 to-white rounded-2xl border-2 border-orange-100">
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-lg">{it.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {(Number(it.calories) || 0) * (Number(it.quantity) || 1)} kcal
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 bg-white rounded-xl p-2 border-2 border-gray-200">
                        <button
                          onClick={() => updateQuantity(idx, (it.quantity || 1) - 1)}
                          className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700"
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-bold text-lg">{it.quantity || 1}</span>
                        <button
                          onClick={() => updateQuantity(idx, (it.quantity || 1) + 1)}
                          className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="w-10 h-10 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 p-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t-2 border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-700">Total Calories</span>
                  <span className="text-4xl font-bold text-orange-600">{totalCalories} kcal</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={saveMeal}
              disabled={!selectedItems.length || saving}
              className="flex-1 px-8 py-4 gradient-primary text-white rounded-2xl font-bold hover:shadow-2xl disabled:opacity-50 transition-all text-lg"
            >
              {saving ? 'Saving...' : 'Save Meal'}
            </button>
            <button
              onClick={() => router.back()}
              className="px-8 py-4 bg-white text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all border-2 border-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}


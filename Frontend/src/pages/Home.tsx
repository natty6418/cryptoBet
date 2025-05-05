import React, { useState } from 'react';
import EventCard from '../components/events/EventCard';
import { useEvents } from '../contexts/EventsContext';
import { categories } from '../data/categories';
import { HelpCircle as CircleHelp } from 'lucide-react';

const Home: React.FC = () => {
  const { events } = useEvents();
  const [activeCategory, setActiveCategory] = useState('all');
  
  const filteredEvents = activeCategory === 'all' 
    ? events 
    : events.filter(event => event.category === activeCategory);

    console.log('Filtered Events:', filteredEvents);
    console.log('Active Category:', activeCategory);
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Prediction Markets</h1>
        <p className="text-slate-400">
          Bet on real-world events using ETH and earn rewards for correct predictions.
        </p>
      </div>
      
      {/* Categories */}
      <div className="overflow-x-auto -mx-4 px-4 pb-4 mb-6">
        <div className="flex space-x-2">
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === 'all' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            onClick={() => setActiveCategory('all')}
          >
            All Markets
          </button>
          
          {categories.map(category => (
            <button 
              key={category.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category.id 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              onClick={() => setActiveCategory(category.name)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Featured Event */}
      {(events.length > 0 && events.some(ev=>ev.status=='live') && activeCategory === 'all') && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Featured Event</h2>
          <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-700/30 rounded-2xl p-6 border border-indigo-600/30">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-3/5">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="badge badge-live flex items-center">
                    <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                    LIVE
                  </span>
                  <span className="text-slate-400 text-sm">{events[0].category}</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">{events[0].title}</h3>
                <p className="text-slate-300 mb-4">{events[0].description}</p>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300">Total Pool</span>
                    <span className="font-semibold">{events[0].pool} ETH</span>
                  </div>

                </div>
              </div>
              
              <div className="md:w-2/5">
                <div className="bg-slate-800/80 rounded-xl p-4">
                  <h4 className="text-lg font-medium mb-3">Place your prediction</h4>
                  
                  {events[0].outcomes.map((outcome, index) => (
                    <div 
                      key={index}
                      className="bg-slate-700 rounded-lg p-3 mb-3 hover:bg-slate-600 transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <span>{outcome.name}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2">

                      </div>
                      <div className="flex justify-between items-center mt-1 text-xs text-slate-400">
                        <span>{outcome.amount} ETH</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Events List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Betting Markets</h2>
          <button className="text-indigo-400 hover:text-indigo-300 flex items-center text-sm">
            <CircleHelp size={16} className="mr-1" />
            How it works
          </button>
        </div>
        
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">No events found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
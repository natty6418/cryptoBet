import React from 'react';
import { Link } from 'react-router-dom';
import { Event } from '../../types';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const { id, title, category, status, pool, outcomes } = event;
  
  return (
    <Link to={`/event/${id}`}>
      <div className="card hover:translate-y-[-4px]">
        <div className="flex items-center space-x-2 mb-3">
          {status === 'live' && (
            <span className="badge badge-live flex items-center">
              <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
              LIVE
            </span>
          )}
          {status === 'upcoming' && (
            <span className="badge badge-upcoming">
              UPCOMING
            </span>
          )}
          {status === 'completed' && (
            <span className="badge badge-completed">
              COMPLETED
            </span>
          )}
          <span className="text-slate-400 text-sm">{category}</span>
        </div>
        
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-slate-400">Total Pool</div>
            <div className="font-medium">{pool} ETH</div>
          </div>
          
          {
          //   <div className="text-right">
          //   <div className="text-sm text-slate-400">
          //     {status === 'completed' ? 'Ended' : 'Ends In'}
          //   </div>
            
          // </div>
          }
        </div>
        
       
        
        <div className="mt-4 flex justify-between items-center text-sm">
          <div className="text-slate-400">
            {outcomes.length} outcomes
          </div>
          <div className="text-indigo-400">View Details →</div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
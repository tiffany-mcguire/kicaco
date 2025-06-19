import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { parse, startOfDay, endOfDay, addDays, isWithinInterval } from 'date-fns';
import KeeperCard from './KeeperCard';
import { useKicacoStore } from '../../store/kicacoStore';
import { getKicacoEventPhoto } from '../../utils/getKicacoEventPhoto';
import { ConfirmDialog } from '../common';

const ThirtyDayKeeperOutlook: React.FC = () => {
  const navigate = useNavigate();
  const keepers = useKicacoStore(state => state.keepers);
  const removeKeeper = useKicacoStore(state => state.removeKeeper);
  const [activeKeeperIndex, setActiveKeeperIndex] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; keeperIndex: number | null; keeperName: string }>({
    isOpen: false,
    keeperIndex: null,
    keeperName: ''
  });

  // Filter keepers for next 30 days
  const keepersNext30Days = useMemo(() => {
    const today = startOfDay(new Date());
    const thirtyDaysFromNow = endOfDay(addDays(today, 30));
    
    return keepers.filter(keeper => {
      if (!keeper.date) return false;
      try {
        const keeperDate = parse(keeper.date, 'yyyy-MM-dd', new Date());
        return isWithinInterval(keeperDate, { start: today, end: thirtyDaysFromNow });
      } catch (e) {
        console.error('Error parsing date for keeper:', keeper, e);
        return false;
      }
    }).sort((a, b) => {
      const dateA = parse(a.date, 'yyyy-MM-dd', new Date());
      const dateB = parse(b.date, 'yyyy-MM-dd', new Date());
      return dateA.getTime() - dateB.getTime();
    });
  }, [keepers]);

  return (
    <div className="mt-8 mb-4">
      <h2 className="text-sm font-medium text-gray-600 mb-4 ml-1 max-w-md mx-auto">
        30-Day Keeper Outlook
      </h2>
      {keepersNext30Days.length > 0 ? (
        <div 
          className="relative w-full max-w-md mx-auto"
          style={{
            height: `${240 + ((keepersNext30Days.length - 1) * 56)}px`,
            marginBottom: '20px',
          }}
        >
          {keepersNext30Days.map((keeper, index) => {
            const stackPosition = keepersNext30Days.length - 1 - index;
            return (
              <KeeperCard
                key={`${keeper.keeperName}-${keeper.date}-${stackPosition}`}
                image={getKicacoEventPhoto(keeper.keeperName)}
                keeperName={keeper.keeperName}
                childName={keeper.childName}
                date={keeper.date}
                time={keeper.time}
                description={keeper.description}
                index={stackPosition}
                stackPosition={stackPosition}
                totalInStack={keepersNext30Days.length}
                isActive={activeKeeperIndex === stackPosition}
                activeIndex={activeKeeperIndex}
                onTabClick={() => setActiveKeeperIndex(activeKeeperIndex === stackPosition ? null : stackPosition)}
                onEdit={() => {
                  const globalKeeperIndex = keepers.findIndex(k => 
                    k.keeperName === keeper.keeperName && 
                    k.date === keeper.date && 
                    k.childName === keeper.childName &&
                    k.time === keeper.time
                  );
                  navigate('/add-keeper', { 
                    state: { 
                      keeper: keeper,
                      keeperIndex: globalKeeperIndex,
                      isEdit: true 
                    } 
                  });
                }}
                onDelete={() => {
                  const globalKeeperIndex = keepers.findIndex(k => 
                    k.keeperName === keeper.keeperName && 
                    k.date === keeper.date && 
                    k.childName === keeper.childName &&
                    k.time === keeper.time
                  );
                  if (globalKeeperIndex !== -1) {
                    setDeleteConfirmation({ 
                      isOpen: true, 
                      keeperIndex: globalKeeperIndex,
                      keeperName: keeper.keeperName
                    });
                  }
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="relative w-full max-w-md mx-auto h-[240px] rounded-xl overflow-hidden shadow-lg">
          {/* Background image */}
          <img
            src={getKicacoEventPhoto('keeper')}
            alt="No keepers"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Full-card overlay */}
          <div className="absolute inset-0 bg-black/[.65]" />
          
          {/* Text centered */}
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white text-base font-normal">No keepers in the next 30 days.</p>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, keeperIndex: null, keeperName: '' })}
        onConfirm={() => {
          if (deleteConfirmation.keeperIndex !== null) {
            removeKeeper(deleteConfirmation.keeperIndex);
            // Reset active keeper if needed
            if (activeKeeperIndex !== null && activeKeeperIndex >= keepersNext30Days.length - 1) {
              setActiveKeeperIndex(null);
            }
          }
        }}
        title="Delete Keeper"
        message="Are you sure you want to delete this keeper?"
        secondaryMessage="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default ThirtyDayKeeperOutlook; 
// Re-orderable bottom navigation tabs configured via Dnd-kit.
// Uses a drag-and-drop overlay to manage active and inactive mobile slots.
import React, { useState } from 'react';
import { 
  DndContext, 
  pointerWithin,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Plus, ChevronLeft, ChevronRight, BarChart3, CreditCard, Target, RefreshCw, PieChart, Calendar, Car, Shield, Settings, GripHorizontal } from 'lucide-react';

function DroppableZone({ id, className, children }: { id: string, className: string, children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} className={className}>{children}</div>;
}

const ALL_TABS = [
  { id: 'overview', icon: BarChart3, label: 'Overview' },
  { id: 'transactions', icon: CreditCard, label: 'Expenses' },
  { id: 'goals', icon: Target, label: 'Goals' },
  { id: 'recurring', icon: RefreshCw, label: 'Recurring' },
  { id: 'analytics', icon: PieChart, label: 'Analytics' },
  { id: 'calendar', icon: Calendar, label: 'Calendar' },
  { id: 'traveling', icon: Car, label: 'Traveling' }
];

function SortableItem({ id, tab, isFull, isActive, moveSlot, removeSlot, addSlot, index, totalActive }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const Icon = tab.icon;

  if (isActive) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
        className="shrink-0 flex flex-col items-center justify-center gap-1 w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-[#121215] border border-blue-500/40 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-500 dark:hover:border-blue-400 transition-colors relative group touch-none"
      >
        <div className="absolute -top-1.5 -right-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button 
            type="button" 
            onPointerDown={(e) => { e.stopPropagation(); removeSlot(index); }}
            className="p-1 bg-rose-50 dark:bg-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/30 text-rose-600 dark:text-rose-300 rounded-full border border-rose-200 dark:border-rose-500/30 shadow-sm"
          >
            <X className="h-2.5 w-2.5 md:h-3 md:w-3" />
          </button>
        </div>
        
        <Icon className="h-4 w-4 md:h-5 md:w-5 text-blue-500 dark:text-blue-400 mt-0.5 md:mt-1" />
        <span className="text-[7px] md:text-[8px] font-medium text-slate-700 dark:text-zinc-300 truncate w-full text-center px-0.5">{tab.label}</span>
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all touch-none group ${
        isFull 
          ? 'bg-slate-100/60 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/[0.04] opacity-40 cursor-not-allowed' 
          : 'bg-white dark:bg-[#16161a] border-slate-200/80 dark:border-white/[0.08] shadow-sm cursor-grab active:cursor-grabbing hover:border-slate-300 dark:hover:border-white/[0.16] active:scale-95'
      }`}
    >
      <Icon className={`h-4 w-4 ${isFull ? 'text-slate-400 dark:text-zinc-600' : 'text-slate-500 dark:text-zinc-400'}`} />
      <span className={`text-xs font-medium ${isFull ? 'text-slate-400 dark:text-zinc-600' : 'text-slate-800 dark:text-zinc-200'} pr-5`}>{tab.label}</span>
      
      {!isFull && (
        <button
          type="button"
          onPointerDown={(e) => { e.stopPropagation(); addSlot(tab.id); }}
          className="absolute right-1.5 p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-md cursor-pointer opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity touch-none z-10"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function NavSettingsDnd({ slots, updateSlots, isAdmin }: { slots: string[], updateSlots: (slots: string[]) => void, isAdmin?: boolean }) {
  const availableTabs = [
    ...ALL_TABS,
    ...(isAdmin ? [{ id: 'admin', icon: Shield, label: 'Admin' }] : [])
  ];

  const [activeIds, setActiveIds] = useState<string[]>(slots);
  const [inactiveIds, setInactiveIds] = useState<string[]>(
    availableTabs.map(t => t.id).filter(id => !slots.includes(id))
  );

  React.useEffect(() => {
    setActiveIds(slots);
    setInactiveIds(availableTabs.map(t => t.id).filter(id => !slots.includes(id)));
  }, [slots, isAdmin]);

  const activeIdsRef = React.useRef(slots);
  React.useEffect(() => {
    activeIdsRef.current = activeIds;
  }, [activeIds]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const wasDraggingActive = React.useRef(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    wasDraggingActive.current = activeIds.includes(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = activeIds.includes(active.id as string) ? 'active' : 'inactive';
    const overContainer = activeIds.includes(over.id as string) ? 'active' : (inactiveIds.includes(over.id as string) ? 'inactive' : over.id as string);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    if (activeContainer === 'inactive' && overContainer === 'active' && activeIds.length >= 6) return;
    if (activeContainer === 'active' && overContainer === 'inactive' && activeIds.length <= 4) return;

    if (activeContainer === 'inactive' && overContainer === 'active') {
      setInactiveIds(prev => prev.filter(id => id !== active.id));
      setActiveIds(prev => {
        const overIndex = prev.indexOf(over.id as string);
        const newIndex = overIndex >= 0 ? overIndex : prev.length;
        const newArray = [...prev];
        newArray.splice(newIndex, 0, active.id as string);
        return newArray;
      });
    } else if (activeContainer === 'active' && overContainer === 'inactive') {
      setActiveIds(prev => prev.filter(id => id !== active.id));
      setInactiveIds(prev => {
        const overIndex = prev.indexOf(over.id as string);
        const newIndex = overIndex >= 0 ? overIndex : prev.length;
        const newArray = [...prev];
        newArray.splice(newIndex, 0, active.id as string);
        return newArray;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) {
      updateSlots(activeIdsRef.current);
      return;
    }

    const currentActiveIds = activeIdsRef.current;
    const currentInactiveIds = availableTabs.map(t => t.id).filter(id => !currentActiveIds.includes(id));

    const activeContainer = currentActiveIds.includes(active.id as string) ? 'active' : 'inactive';
    const overContainer = currentActiveIds.includes(over.id as string) ? 'active' : (currentInactiveIds.includes(over.id as string) ? 'inactive' : over.id as string);

    let finalActiveIds = [...currentActiveIds];

    if (activeContainer === overContainer) {
      if (activeContainer === 'active') {
        const oldIndex = currentActiveIds.indexOf(active.id as string);
        const newIndex = currentActiveIds.indexOf(over.id as string);
        if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
          finalActiveIds = arrayMove(currentActiveIds, oldIndex, newIndex);
          setActiveIds(finalActiveIds);
        }
      } else {
        const oldIndex = currentInactiveIds.indexOf(active.id as string);
        const newIndex = currentInactiveIds.indexOf(over.id as string);
        if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
          setInactiveIds(arrayMove(currentInactiveIds, oldIndex, newIndex));
        }
      }
    }

    updateSlots(finalActiveIds);
  };

  const moveSlot = (from: number, to: number) => {
    const newSlots = arrayMove(activeIds, from, to);
    setActiveIds(newSlots);
    updateSlots(newSlots);
  };

  const removeSlot = (index: number) => {
    if (activeIds.length <= 4) return;
    const item = activeIds[index];
    const newActive = activeIds.filter((_, i) => i !== index);
    setActiveIds(newActive);
    setInactiveIds([...inactiveIds, item]);
    updateSlots(newActive);
  };

  const addSlot = (id: string) => {
    if (activeIds.length >= 6) return;
    const newActive = [...activeIds, id];
    setActiveIds(newActive);
    setInactiveIds(inactiveIds.filter(i => i !== id));
    updateSlots(newActive);
  };

  const activeItemData = activeId ? availableTabs.find(t => t.id === activeId) : null;
  const isDraggingActive = wasDraggingActive.current;

  return (
    <>
      <div className="border-b border-slate-200/80 dark:border-white/[0.06] pb-4 mb-4">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">Bottom Navigation</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Design your mobile bottom app bar using drag and drop.</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Active Navigation <span className="text-slate-400 dark:text-zinc-500 font-medium">({activeIds.length}/6 max)</span></h3>
              {activeIds.length <= 4 && <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2 py-0.5 rounded">Minimum Reached</span>}
            </div>
            
            <SortableContext id="active" items={activeIds} strategy={horizontalListSortingStrategy}>
              <DroppableZone id="active" className="flex flex-wrap md:flex-nowrap gap-2 md:gap-3 overflow-x-auto pb-3 custom-scrollbar items-center bg-slate-50/70 dark:bg-[#16161a] p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] border-dashed min-h-[90px]">
                {activeIds.map((id, index) => {
                  const tab = availableTabs.find(t => t.id === id);
                  if (!tab) return null;
                  return (
                    <SortableItem 
                      key={id} 
                      id={id} 
                      tab={tab} 
                      isActive={true}
                      index={index}
                      totalActive={activeIds.length}
                      moveSlot={moveSlot}
                      removeSlot={removeSlot}
                    />
                  );
                })}
              </DroppableZone>
            </SortableContext>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2.5">Available Tabs</h3>
            
            <SortableContext id="inactive" items={inactiveIds} strategy={rectSortingStrategy}>
              <DroppableZone id="inactive" className="flex flex-row flex-wrap gap-2.5 bg-slate-50/40 dark:bg-[#121215] p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] min-h-[70px]">
                {inactiveIds.map((id) => {
                  const tab = availableTabs.find(t => t.id === id);
                  if (!tab) return null;
                  return (
                    <SortableItem 
                      key={id} 
                      id={id} 
                      tab={tab} 
                      isActive={false}
                      isFull={activeIds.length >= 6}
                      addSlot={addSlot}
                    />
                  );
                })}
                {inactiveIds.length === 0 && (
                  <p className="text-xs text-slate-500 dark:text-zinc-500 font-medium py-2">All tabs are currently in use.</p>
                )}
              </DroppableZone>
            </SortableContext>
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 250, easing: 'ease' }}>
          {activeItemData ? (
            isDraggingActive ? (
              <div className="shrink-0 flex flex-col items-center justify-center gap-2 w-16 h-16 bg-white dark:bg-[#16161a] border-2 border-blue-500 rounded-xl shadow-2xl cursor-grabbing relative">
                <activeItemData.icon className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-1" />
                <span className="text-[9px] font-medium text-slate-900 dark:text-white truncate w-full text-center px-1">{activeItemData.label}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white dark:bg-[#16161a] border-blue-500 shadow-2xl cursor-grabbing">
                <activeItemData.icon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <span className="text-xs font-medium text-slate-900 dark:text-white">{activeItemData.label}</span>
              </div>
            )
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}

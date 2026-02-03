'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  List,
  Grid3X3,
  X,
  Wrench,
  AlertTriangle,
  ArrowUpCircle,
} from 'lucide-react';
import { EnterpriseSidebar } from '@/components/enterprise/Dashboard/EnterpriseSidebar';
import { EnterpriseTopBar } from '@/components/enterprise/Dashboard/EnterpriseTopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type MaintenanceType = 'scheduled' | 'emergency' | 'upgrade';
type ViewType = 'month' | 'week' | 'list';

interface MaintenanceEvent {
  id: string;
  proverId: string;
  proverName: string;
  type: MaintenanceType;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
}

// Demo data
const FALLBACK_EVENTS: MaintenanceEvent[] = [
  {
    id: '1',
    proverId: 'prv-001',
    proverName: 'Tokyo Primary',
    type: 'scheduled',
    title: 'Routine Maintenance',
    description: 'Monthly security patches and updates',
    startDate: new Date(2026, 0, 28, 2, 0),
    endDate: new Date(2026, 0, 28, 4, 0),
  },
  {
    id: '2',
    proverId: 'prv-002',
    proverName: 'Tokyo Secondary',
    type: 'upgrade',
    title: 'Version Upgrade to 2.5.0',
    description: 'Major version upgrade with new features',
    startDate: new Date(2026, 1, 5, 3, 0),
    endDate: new Date(2026, 1, 5, 6, 0),
  },
  {
    id: '3',
    proverId: 'prv-003',
    proverName: 'Singapore Node',
    type: 'scheduled',
    title: 'Certificate Renewal',
    description: 'SSL certificate renewal',
    startDate: new Date(2026, 1, 15, 1, 0),
    endDate: new Date(2026, 1, 15, 2, 0),
  },
];

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function getTypeConfig(type: MaintenanceType) {
  switch (type) {
    case 'scheduled':
      return { icon: Wrench, color: 'text-info', bgColor: 'bg-info/10', borderColor: 'border-info/30' };
    case 'emergency':
      return { icon: AlertTriangle, color: 'text-danger', bgColor: 'bg-danger/10', borderColor: 'border-danger/30' };
    case 'upgrade':
      return { icon: ArrowUpCircle, color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-success/30' };
  }
}

interface MaintenanceFormProps {
  onClose: () => void;
  onSave: (data: Partial<MaintenanceEvent>) => void;
}

function MaintenanceForm({ onClose, onSave }: MaintenanceFormProps) {
  const t = useTranslations('enterprise.proverCalendar');
  const [formData, setFormData] = useState({
    proverId: '',
    type: 'scheduled' as MaintenanceType,
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    notify: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold">{t('form.title')}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5" aria-label={t('form.cancel')}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('form.prover')}</label>
            <select
              value={formData.proverId}
              onChange={(e) => setFormData({ ...formData, proverId: e.target.value })}
              className="w-full px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm"
              required
            >
              <option value="">Select Prover</option>
              <option value="prv-001">Tokyo Primary</option>
              <option value="prv-002">Tokyo Secondary</option>
              <option value="prv-003">Singapore Node</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('form.type')}</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as MaintenanceType })}
              className="w-full px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm"
            >
              <option value="scheduled">{t('types.scheduled')}</option>
              <option value="emergency">{t('types.emergency')}</option>
              <option value="upgrade">{t('types.upgrade')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('form.startDate')}</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('form.endDate')}</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('form.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notify"
              checked={formData.notify}
              onChange={(e) => setFormData({ ...formData, notify: e.target.checked })}
              className="rounded border-white/20"
            />
            <label htmlFor="notify" className="text-sm text-foreground-secondary">
              {t('form.notify')}
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('form.cancel')}
            </Button>
            <Button type="submit">{t('form.save')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function ProverCalendar() {
  const t = useTranslations('enterprise.proverCalendar');
  const tCommon = useTranslations('enterprise');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [showForm, setShowForm] = useState(false);
  const [events, setEvents] = useState(FALLBACK_EVENTS);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const handleSave = (data: Partial<MaintenanceEvent>) => {
    const newEvent: MaintenanceEvent = {
      id: `evt-${Date.now()}`,
      proverId: data.proverId || '',
      proverName: 'New Prover',
      type: data.type || 'scheduled',
      title: data.title || 'New Maintenance',
      description: data.description || '',
      startDate: data.startDate || new Date(),
      endDate: data.endDate || new Date(),
    };
    setEvents([...events, newEvent]);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <EnterpriseSidebar />

      <div className="flex-1 ml-[260px]">
        <EnterpriseTopBar
          pageTitle={t('pageTitle')}
          userName={tCommon('dashboard.demoUser.name')}
          userInitial={tCommon('dashboard.demoUser.initial')}
        />

        <main className="p-8" role="main" aria-label={t('ariaLabel')}>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-semibold min-w-[180px] text-center">
                  {monthNames[month]} {year}
                </h2>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <Button variant="outline" size="sm" onClick={goToToday}>
                {t('today')}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {/* View type buttons */}
              <div className="flex border border-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewType('month')}
                  className={cn(
                    'px-3 py-1.5 text-sm transition-colors',
                    viewType === 'month' ? 'bg-hinomaru text-white' : 'hover:bg-white/5'
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewType('list')}
                  className={cn(
                    'px-3 py-1.5 text-sm transition-colors',
                    viewType === 'list' ? 'bg-hinomaru text-white' : 'hover:bg-white/5'
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <Button size="sm" className="gap-2" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                {t('addMaintenance')}
              </Button>
            </div>
          </div>

          {/* Calendar */}
          {viewType === 'month' && (
            <Card className="overflow-hidden">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b border-white/10 bg-background-tertiary/50">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="px-2 py-3 text-center text-xs font-semibold text-foreground-secondary uppercase"
                  >
                    {t(`weekdays.${day}`)}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {/* Empty cells for days before the first of the month */}
                {Array.from({ length: startDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-24 border-r border-b border-white/5 bg-background-tertiary/20" />
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const date = new Date(year, month, day);
                  const dayEvents = getEventsForDate(date);

                  return (
                    <div
                      key={day}
                      className={cn(
                        'h-24 border-r border-b border-white/5 p-1 hover:bg-white/[0.02] transition-colors',
                        isToday(day) && 'bg-hinomaru/5'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={cn(
                            'w-6 h-6 flex items-center justify-center text-sm rounded-full',
                            isToday(day) && 'bg-hinomaru text-white font-bold'
                          )}
                        >
                          {day}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => {
                          const config = getTypeConfig(event.type);
                          return (
                            <div
                              key={event.id}
                              className={cn(
                                'px-1.5 py-0.5 text-[10px] rounded truncate border',
                                config.bgColor,
                                config.borderColor,
                                config.color
                              )}
                              title={event.title}
                            >
                              {event.proverName}
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] text-foreground-tertiary px-1">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* List view */}
          {viewType === 'list' && (
            <Card className="overflow-hidden">
              <div className="divide-y divide-white/5">
                {events.length === 0 ? (
                  <div className="p-12 text-center">
                    <CalendarIcon className="h-12 w-12 text-foreground-tertiary mx-auto mb-4" />
                    <p className="text-foreground-secondary">No maintenance scheduled</p>
                  </div>
                ) : (
                  events
                    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
                    .map((event) => {
                      const config = getTypeConfig(event.type);
                      const Icon = config.icon;

                      return (
                        <div key={event.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-start gap-4">
                            <div className={cn('p-2 rounded-lg', config.bgColor)}>
                              <Icon className={cn('h-5 w-5', config.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{event.title}</span>
                                <Badge variant="default" className="text-xs">
                                  {event.proverName}
                                </Badge>
                              </div>
                              <p className="text-sm text-foreground-secondary mb-2">{event.description}</p>
                              <div className="flex items-center gap-4 text-xs text-foreground-tertiary">
                                <span>
                                  {event.startDate.toLocaleDateString()} {event.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span>→</span>
                                <span>
                                  {event.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </Card>
          )}

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6">
            {(['scheduled', 'emergency', 'upgrade'] as MaintenanceType[]).map((type) => {
              const config = getTypeConfig(type);
              const Icon = config.icon;
              return (
                <div key={type} className="flex items-center gap-2 text-sm">
                  <Icon className={cn('h-4 w-4', config.color)} />
                  <span className="text-foreground-secondary">{t(`types.${type}`)}</span>
                </div>
              );
            })}
          </div>
        </main>

        {/* Form Modal */}
        {showForm && <MaintenanceForm onClose={() => setShowForm(false)} onSave={handleSave} />}
      </div>
    </div>
  );
}

export default ProverCalendar;

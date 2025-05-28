
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Alert, AlertType, AlertSeverity, AlertStatus, Engineer, Coordinates } from '@/lib/types';
import { alertTypes, alertSeverities, alertStatuses } from '@/lib/types';
import { AlertCard } from './alert-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label"; 
import { BellRing, Filter, Trash2, CheckSquare, Search, ListFilter, Users } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

const mockEngineers: Pick<Engineer, 'id' | 'name'>[] = [
  { id: "eng1", name: "Alice Smith" },
  { id: "eng2", name: "Bob Johnson" },
  { id: "eng3", name: "Charlie Brown" },
  { id: "eng4", name: "Diana Prince" },
];

// Function to generate a more realistic mock alert
const generateMockAlert = (idSuffix: number): Alert => {
  const randomEngineer = mockEngineers[Math.floor(Math.random() * mockEngineers.length)];
  const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
  const randomSeverity = alertSeverities[Math.floor(Math.random() * alertSeverities.length)];
  const randomStatus = alertStatuses[Math.floor(Math.random() * alertStatuses.length)];
  
  const baseLocation: Coordinates = { lat: 34.0522, lng: -118.2437 }; // LA
  const location: Coordinates = {
    lat: baseLocation.lat + (Math.random() - 0.5) * 0.1,
    lng: baseLocation.lng + (Math.random() - 0.5) * 0.1,
  };

  let details = `Investigate ${randomType.toLowerCase()} for ${randomEngineer.name}.`;
  if (randomType === "Speeding") details = `${randomEngineer.name} detected speeding at ${Math.floor(Math.random()*30 + 80)} km/h.`;
  if (randomType === "Long Idle") details = `${randomEngineer.name} has been idle for ${Math.floor(Math.random()*30 + 10)} minutes.`;


  return {
    id: `alert-${Date.now()}-${idSuffix}`,
    timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 5).toISOString(), // within last 5 hours
    type: randomType,
    severity: randomSeverity,
    engineerId: randomEngineer.id,
    engineerName: randomEngineer.name,
    location,
    locationSnippet: `Near ${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}`,
    details,
    routeTrace: Math.random() > 0.5 ? [
        location, 
        {lat: location.lat + 0.001, lng: location.lng + 0.001},
        {lat: location.lat - 0.001, lng: location.lng + 0.002}
    ] : undefined,
    status: randomStatus,
    notifications: {
      push: Math.random() > 0.5,
      email: Math.random() > 0.5,
    },
  };
};


export function AlertsDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  
  const [filterType, setFilterType] = useState<AlertType | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AlertStatus | 'all'>('all');
  const [filterEngineer, setFilterEngineer] = useState<string | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Mock real-time alert stream
  useEffect(() => {
    // Initial batch of alerts
    const initialAlerts = Array.from({ length: 10 }, (_, i) => generateMockAlert(i));
    setAlerts(initialAlerts.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    const intervalId = setInterval(() => {
      setAlerts(prevAlerts => {
        const newAlert = generateMockAlert(prevAlerts.length);
        const updatedAlerts = [newAlert, ...prevAlerts];
        // Keep a maximum of 50 alerts for performance in this demo
        return updatedAlerts.slice(0, 50).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
    }, 15000); // New alert every 15 seconds

    return () => clearInterval(intervalId);
  }, []);

  const handleSelectAlert = (alertId: string) => {
    setSelectedAlerts(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(alertId)) {
        newSelection.delete(alertId);
      } else {
        newSelection.add(alertId);
      }
      return newSelection;
    });
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedAlerts(new Set(filteredAlerts.map(a => a.id)));
    } else {
      setSelectedAlerts(new Set());
    }
  };
  
  const handleStatusChange = (alertId: string, status: AlertStatus) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status } : a));
  };

  const handleNotificationChange = (alertId: string, type: 'push' | 'email', value: boolean) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, notifications: { ...a.notifications, [type]: value } } : a));
  };

  const handleBulkAction = (status: AlertStatus) => {
    setAlerts(prev => prev.map(a => selectedAlerts.has(a.id) ? { ...a, status } : a));
    setSelectedAlerts(new Set());
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => 
      (filterType === 'all' || alert.type === filterType) &&
      (filterSeverity === 'all' || alert.severity === filterSeverity) &&
      (filterStatus === 'all' || alert.status === filterStatus) &&
      (filterEngineer === 'all' || alert.engineerId === filterEngineer) &&
      (searchTerm === '' || 
        alert.engineerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.locationSnippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (alert.details && alert.details.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    );
  }, [alerts, filterType, filterSeverity, filterStatus, filterEngineer, searchTerm]);

  const activeAlertCount = useMemo(() => alerts.filter(a => a.status === 'new').length, [alerts]);

  const isAllSelected = filteredAlerts.length > 0 && selectedAlerts.size === filteredAlerts.length;
  const isIndeterminate = selectedAlerts.size > 0 && selectedAlerts.size < filteredAlerts.length;


  return (
    <div className="space-y-6"> {/* Removed min-h-screen and outer padding, will be handled by AppLayout */}
      <div className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <BellRing className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Alerts Dashboard</h1>
        </div>
        <Badge variant="destructive" className="text-sm px-3 py-1.5">
          {activeAlertCount} New Alerts
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end p-4 bg-card rounded-lg shadow">
        <div className="relative">
          <Input 
            placeholder="Search alerts..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        
        <Select value={filterType} onValueChange={(value) => setFilterType(value as AlertType | 'all')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {alertTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterSeverity} onValueChange={(value) => setFilterSeverity(value as AlertSeverity | 'all')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            {alertSeverities.map(sev => <SelectItem key={sev} value={sev} className="capitalize">{sev}</SelectItem>)}
          </SelectContent>
        </Select>

         <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as AlertStatus | 'all')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {alertStatuses.map(stat => <SelectItem key={stat} value={stat} className="capitalize">{stat}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterEngineer} onValueChange={(value) => setFilterEngineer(value as string | 'all')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by Engineer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Engineers</SelectItem>
            {mockEngineers.map(eng => <SelectItem key={eng.id} value={eng.id}>{eng.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow">
        <div className="flex items-center space-x-3">
          <Checkbox 
            id="select-all"
            checked={isAllSelected || isIndeterminate}
            onCheckedChange={handleSelectAll}
            aria-label="Select all alerts"
            className={isIndeterminate ? '[&[data-state=checked]>span]:bg-muted-foreground' : ''}
          />
          <Label htmlFor="select-all" className="text-sm font-medium">
            Select All ({selectedAlerts.size} selected)
          </Label>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={() => handleBulkAction('reviewed')} 
            disabled={selectedAlerts.size === 0}
            variant="outline"
            size="sm"
          >
            <CheckSquare className="mr-2 h-4 w-4" /> Mark as Reviewed
          </Button>
          <Button 
            onClick={() => handleBulkAction('dismissed')} 
            disabled={selectedAlerts.size === 0}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Dismiss Selected
          </Button>
        </div>
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <ListFilter className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg">No alerts match your current filters.</p>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      )}

      <ScrollArea className="h-[calc(100vh-480px)] md:h-[calc(100vh-420px)] pr-3"> {/* Adjusted height based on typical viewport */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredAlerts.map(alert => (
            <AlertCard 
              key={alert.id} 
              alert={alert}
              isSelected={selectedAlerts.has(alert.id)}
              onSelectToggle={handleSelectAlert}
              onStatusChange={handleStatusChange}
              onNotificationChange={handleNotificationChange}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

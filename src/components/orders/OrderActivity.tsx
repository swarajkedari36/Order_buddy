import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Activity, Clock, User, AlertCircle } from "lucide-react";

interface OrderActivityItem {
  id: string;
  orderId: string;
  userId?: string;
  activityType: string;
  description: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  createdAt: string;
}

interface OrderActivityProps {
  orderId?: string;
  maxItems?: number;
}

export const OrderActivity = ({ orderId, maxItems = 10 }: OrderActivityProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<OrderActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user, orderId]);

  const fetchActivities = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('order_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(maxItems);

      if (orderId) {
        query = query.eq('order_id', orderId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching order activities:', error);
        toast({
          title: "Error",
          description: "Failed to fetch order activities",
          variant: "destructive",
        });
        return;
      }

      const formattedActivities: OrderActivityItem[] = data.map(activity => ({
        id: activity.id,
        orderId: activity.order_id,
        userId: activity.user_id,
        activityType: activity.activity_type,
        description: activity.description,
        oldValues: activity.old_values as Record<string, any> | undefined,
        newValues: activity.new_values as Record<string, any> | undefined,
        createdAt: activity.created_at,
      }));

      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error fetching order activities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch order activities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'created':
        return <User className="h-4 w-4" />;
      case 'updated':
        return <Activity className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'created':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'updated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatActivityDetails = (activity: OrderActivityItem) => {
    if (activity.activityType === 'created') {
      return 'Order was created';
    }
    
    if (activity.activityType === 'updated' && activity.oldValues && activity.newValues) {
      const changes: string[] = [];
      
      // Compare old and new values to show what changed
      Object.keys(activity.newValues).forEach(key => {
        const oldValue = activity.oldValues?.[key];
        const newValue = activity.newValues?.[key];
        
        if (oldValue !== newValue && key !== 'updated_at' && key !== 'last_activity_at') {
          const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          changes.push(`${fieldName}: ${oldValue} → ${newValue}`);
        }
      });
      
      return changes.length > 0 ? changes.join(', ') : 'Order was updated';
    }
    
    return activity.description;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Order Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          {orderId ? 'Order Activity' : 'Recent Activity'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-6">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Activity</h3>
            <p className="text-muted-foreground">
              No order activities to display yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${getActivityColor(activity.activityType)}`}>
                  {getActivityIcon(activity.activityType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {formatActivityDetails(activity)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {activity.activityType}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                    {!orderId && (
                      <span className="text-xs text-muted-foreground">
                        • Order ID: {activity.orderId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {activities.length === maxItems && (
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing last {maxItems} activities
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
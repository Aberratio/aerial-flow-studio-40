import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const PricingSkeleton: React.FC = () => {
  return (
    <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <Skeleton className="h-12 w-80 mx-auto mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-full max-w-3xl mx-auto" />
            <Skeleton className="h-6 w-4/5 max-w-3xl mx-auto" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Left decorative card skeleton */}
          <Card className="glass-effect">
            <CardContent className="px-8 py-12 h-full flex flex-col justify-center items-center text-center">
              <Skeleton className="h-8 w-48 mb-10" />
              <Skeleton className="w-24 h-24 rounded-full mb-10" />
              <Skeleton className="h-6 w-40 mb-10" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>

          {/* Pricing plans skeleton */}
          {[...Array(2)].map((_, index) => (
            <Card key={index} className="glass-effect">
              <CardHeader className="text-center p-6">
                <Skeleton className="w-8 h-8 rounded-full mx-auto mb-2" />
                <Skeleton className="h-6 w-24 mx-auto mb-2" />
                <Skeleton className="h-4 w-36 mx-auto mb-4" />
                <div className="flex items-center justify-center space-x-1">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center">
                      <Skeleton className="w-5 h-5 mr-3 flex-shrink-0" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
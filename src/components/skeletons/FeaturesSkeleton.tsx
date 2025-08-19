import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export const FeaturesSkeleton: React.FC = () => {
  return (
    <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <Skeleton className="h-12 w-96 mx-auto mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-full max-w-3xl mx-auto" />
            <Skeleton className="h-6 w-4/5 max-w-3xl mx-auto" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="glass-effect border-white/10">
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <Skeleton className="w-16 h-16 rounded-2xl mb-6" />
                <Skeleton className="h-6 w-32 mb-3" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5 mx-auto" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
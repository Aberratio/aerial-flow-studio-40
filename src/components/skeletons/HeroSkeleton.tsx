import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const HeroSkeleton: React.FC = () => {
  return (
    <section className="relative px-4 sm:px-6 pt-5 sm:pt-20 pb-16 sm:pb-32 z-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
            <div className="space-y-4 sm:space-y-6">
              {/* Title skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-12 sm:h-16 lg:h-20 w-full" />
                <Skeleton className="h-12 sm:h-16 lg:h-20 w-3/4" />
              </div>
              
              {/* Description skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            </div>

            {/* Button skeleton */}
            <Skeleton className="h-12 w-48 mx-auto lg:mx-0" />

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 sm:flex sm:items-center sm:space-x-8 gap-4 sm:gap-0 pt-6 sm:pt-8 max-w-sm mx-auto lg:mx-0">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Hero image skeleton */}
          <div className="relative order-first lg:order-last">
            <Skeleton className="rounded-2xl w-[400px] h-[600px] sm:w-[450px] sm:h-[650px] lg:w-[500px] lg:h-[700px] mx-auto" />
          </div>
        </div>
      </div>
    </section>
  );
};
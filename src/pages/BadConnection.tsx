import React from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const BadConnection = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-6">
      <Card className="glass-effect border-white/10 max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-red-400 animate-pulse" />
          </div>
          
          <h1 className="text-2xl font-semibold text-white mb-4">Connection Problem</h1>
          <p className="text-muted-foreground mb-8">
            We're having trouble connecting to our servers. Please check your internet connection and try again.
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-2 text-muted-foreground text-sm">
              <Wifi className="w-4 h-4" />
              <span>Checking connection...</span>
            </div>
            
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
          
          <Button 
            onClick={handleRetry}
            className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-muted-foreground text-sm">
              If the problem persists, please check your internet connection or try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BadConnection;
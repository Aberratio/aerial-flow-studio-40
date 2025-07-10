import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft } from 'lucide-react';

const PaymentCancelled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-6">
      <Card className="max-w-md w-full glass-effect border-white/10 text-center">
        <CardHeader>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <CardTitle className="text-white text-2xl">Payment Cancelled</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-muted-foreground">
            <p>Your payment was cancelled. No charges have been made to your account.</p>
            <p className="mt-2">You can try again at any time to unlock premium features.</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            
            <Button
              onClick={() => navigate('/pricing')}
              className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
            >
              View Pricing Again
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => navigate('/feed')}
              className="w-full text-muted-foreground hover:text-white"
            >
              Continue to Feed
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancelled;
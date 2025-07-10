import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <Card className="glass-effect border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              We collect information you provide directly to us, such as when you create an account, 
              update your profile, post content, or communicate with us.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (username, email, profile picture)</li>
              <li>Content you create (posts, comments, progress tracking)</li>
              <li>Usage data and analytics</li>
              <li>Device and technical information</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white">How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and maintain our services</li>
              <li>Personalize your experience</li>
              <li>Enable social features and community interaction</li>
              <li>Track your progress and achievements</li>
              <li>Send you notifications and updates</li>
              <li>Improve our services and develop new features</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Information Sharing</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              We do not sell, trade, or rent your personal information to third parties. 
              We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
              <li>With service providers who assist us in operating our platform</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Data Security</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              We implement appropriate security measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              If you have any questions about this Privacy Policy, please contact us at 
              privacy@aerialjourney.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
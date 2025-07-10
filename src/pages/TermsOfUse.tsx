import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const TermsOfUse = () => {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Use</h1>
        
        <Card className="glass-effect border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              By accessing and using AerialJourney, you accept and agree to be bound by the terms 
              and provision of this agreement.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Scoring System & Points</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>
              AerialJourney uses a scoring system to reward user engagement and progress. 
              Points are awarded for various activities as outlined below:
            </p>
            
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white">Activity</TableHead>
                  <TableHead className="text-white">Points Awarded</TableHead>
                  <TableHead className="text-white">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-white/10">
                  <TableCell className="font-medium text-white">Create Post</TableCell>
                  <TableCell className="text-muted-foreground">10 points</TableCell>
                  <TableCell className="text-muted-foreground">Sharing your aerial journey with the community</TableCell>
                </TableRow>
                <TableRow className="border-white/10">
                  <TableCell className="font-medium text-white">Receive Like</TableCell>
                  <TableCell className="text-muted-foreground">2 points</TableCell>
                  <TableCell className="text-muted-foreground">When someone likes your post</TableCell>
                </TableRow>
                <TableRow className="border-white/10">
                  <TableCell className="font-medium text-white">Write Comment</TableCell>
                  <TableCell className="text-muted-foreground">5 points</TableCell>
                  <TableCell className="text-muted-foreground">Engaging with others' content</TableCell>
                </TableRow>
                <TableRow className="border-white/10">
                  <TableCell className="font-medium text-white">Receive Comment</TableCell>
                  <TableCell className="text-muted-foreground">3 points</TableCell>
                  <TableCell className="text-muted-foreground">When someone comments on your post</TableCell>
                </TableRow>
                <TableRow className="border-white/10">
                  <TableCell className="font-medium text-white">Complete Challenge Day</TableCell>
                  <TableCell className="text-muted-foreground">25 points</TableCell>
                  <TableCell className="text-muted-foreground">Finishing a day in any challenge</TableCell>
                </TableRow>
                <TableRow className="border-white/10">
                  <TableCell className="font-medium text-white">Complete Figure</TableCell>
                  <TableCell className="text-muted-foreground">15 points</TableCell>
                  <TableCell className="text-muted-foreground">Mastering a new aerial figure</TableCell>
                </TableRow>
                 <TableRow className="border-white/10">
                   <TableCell className="font-medium text-white">Send Friend Request</TableCell>
                   <TableCell className="text-muted-foreground">2 points</TableCell>
                   <TableCell className="text-muted-foreground">Reaching out to new friends</TableCell>
                 </TableRow>
                 <TableRow className="border-white/10">
                   <TableCell className="font-medium text-white">Accept Friend Request</TableCell>
                   <TableCell className="text-muted-foreground">5 points</TableCell>
                   <TableCell className="text-muted-foreground">Welcoming new friends</TableCell>
                 </TableRow>
                 <TableRow className="border-white/10">
                   <TableCell className="font-medium text-white">Friend Request Accepted</TableCell>
                   <TableCell className="text-muted-foreground">5 points</TableCell>
                   <TableCell className="text-muted-foreground">When someone accepts your friend request</TableCell>
                 </TableRow>
                 <TableRow className="border-white/10">
                   <TableCell className="font-medium text-white">Follow Someone</TableCell>
                   <TableCell className="text-muted-foreground">1 point</TableCell>
                   <TableCell className="text-muted-foreground">Building your network</TableCell>
                 </TableRow>
                 <TableRow className="border-white/10">
                   <TableCell className="font-medium text-white">Gain Follower</TableCell>
                   <TableCell className="text-muted-foreground">5 points</TableCell>
                   <TableCell className="text-muted-foreground">When someone follows you</TableCell>
                 </TableRow>
                 <TableRow className="border-white/10">
                   <TableCell className="font-medium text-white">Complete Training Session</TableCell>
                   <TableCell className="text-muted-foreground">20 points</TableCell>
                   <TableCell className="text-muted-foreground">Finishing a custom training session</TableCell>
                 </TableRow>
              </TableBody>
            </Table>
            
            <p className="text-sm">
              Points are automatically calculated and added to your total score. 
              The scoring system is designed to encourage active participation and progress tracking.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white">User Conduct</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4">
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Post content that is illegal, harmful, or offensive</li>
              <li>Harass or intimidate other users</li>
              <li>Share false or misleading information</li>
              <li>Attempt to manipulate the scoring system</li>
              <li>Use the platform for commercial purposes without permission</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Content Ownership</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              You retain ownership of the content you post. By posting content, you grant us 
              a non-exclusive license to use, display, and distribute your content on our platform.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              AerialJourney is provided "as is" without warranties. We are not liable for any 
              damages arising from your use of the platform.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfUse;
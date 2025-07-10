import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, Target, Star } from 'lucide-react';

const AboutUs = () => {
  const values = [
    {
      icon: Heart,
      title: 'Passion for Aerial Arts',
      description: 'We believe in the transformative power of aerial arts and are dedicated to supporting every athlete on their journey.'
    },
    {
      icon: Users,
      title: 'Community First',
      description: 'Building a supportive community where aerial artists can connect, learn, and grow together.'
    },
    {
      icon: Target,
      title: 'Focused Training',
      description: 'Providing structured, progressive training programs designed by professional instructors.'
    },
    {
      icon: Star,
      title: 'Excellence',
      description: 'Committed to delivering the highest quality training resources and user experience.'
    }
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-4">About AerialJourney</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Empowering aerial artists worldwide with comprehensive training programs, 
            community support, and progress tracking tools.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="glass-effect border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-center text-2xl">Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground text-lg leading-relaxed">
              To make aerial arts accessible to everyone by providing world-class training programs, 
              fostering a supportive community, and tracking progress through innovative technology. 
              We believe that every person has the potential to soar, and we're here to help them reach new heights.
            </p>
          </CardContent>
        </Card>

        {/* Our Values */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <Card key={index} className="glass-effect border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-2">{value.title}</h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Story */}
        <Card className="glass-effect border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-center text-2xl">Our Story</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-muted-foreground">
              <p>
                AerialJourney was born from a simple observation: aerial arts training was scattered, 
                inconsistent, and often inaccessible to many who wanted to learn. Our founders, 
                experienced aerial instructors and technologists, came together with a vision to 
                democratize aerial arts education.
              </p>
              <p>
                What started as a small project to help local students track their progress has 
                evolved into a comprehensive platform serving thousands of aerial artists worldwide. 
                We've partnered with certified instructors, professional performers, and industry 
                experts to create the most comprehensive aerial arts training platform available.
              </p>
              <p>
                Today, AerialJourney continues to grow, driven by our community's feedback and our 
                commitment to innovation. We're not just building a platform; we're building a 
                movement that makes aerial arts accessible, safe, and enjoyable for everyone.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="glass-effect border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-center text-2xl">Get in Touch</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Have questions, suggestions, or just want to say hello? We'd love to hear from you!
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p>Email: hello@aerialjourney.com</p>
              <p>Support: support@aerialjourney.com</p>
              <p>Partnership: partners@aerialjourney.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutUs;
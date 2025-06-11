import { Header } from '@/components/global/header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '0',
    description: 'Perfect for trying out our service',
    features: [
      'Create up to 10 encrypted QR codes monthly',
      'Unlimited QR code verification',
      'Limited appearance customization',
      'Email support',
      'QR code validity up to 5 days'
    ],
    buttonText: 'Get Started',
    highlighted: false
  },
  {
    name: 'Basic',
    price: '9.99',
    period: 'month',
    yearlyPrice: '99',
    yearlyPeriod: 'year',
    description: 'Great for small businesses',
    features: [
      'Create up to 100 QR codes monthly',
      'Basic dashboard with statistics',
      'Full QR code appearance customization',
      'Additional verification options',
      'Ad-free experience',
      'QR code validity up to 1 year'
    ],
    buttonText: 'Start Free Trial',
    highlighted: true
  },
  {
    name: 'Professional',
    price: '29.99',
    period: 'month',
    yearlyPrice: '299',
    yearlyPeriod: 'year',
    description: 'Perfect for growing businesses',
    features: [
      'Create up to 1000 QR codes monthly',
      'Advanced dashboard with detailed statistics',
      'Full customization with logo embedding',
      'Bulk QR code generation and printing',
      'Offline verification capability',
      'Ad-free experience',
      'Detailed verification reports',
      'API integration',
      'Custom branded interface',
      'QR code validity up to 1 year'
    ],
    buttonText: 'Start Free Trial',
    highlighted: false
  },
  {
    name: 'Enterprise',
    price: '999',
    period: 'month',
    description: 'Custom solutions for large organizations',
    features: [
      'Unlimited QR code creation',
      'Custom solutions based on requirements',
      'On-premise hosting option',
      'Ad-free experience',
      'Full integration with existing systems',
      '24/7 technical support',
      'Custom training and setup'
    ],
    buttonText: 'Contact Sales',
    highlighted: false
  }
];

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Select the perfect plan for your needs. All plans include our core security features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`flex flex-col ${
                plan.highlighted 
                  ? 'border-primary shadow-lg scale-105' 
                  : ''
              }`}
            >
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">/{plan.period}</span>
                  )}
                  {plan.yearlyPrice && (
                    <div className="text-sm text-muted-foreground mt-1">
                      or ${plan.yearlyPrice}/{plan.yearlyPeriod}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full ${
                    plan.highlighted 
                      ? 'bg-primary hover:bg-primary/90' 
                      : 'bg-secondary hover:bg-secondary/90'
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
} 
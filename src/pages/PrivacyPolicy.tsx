import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

const PrivacyPolicy = () => {
  const content = {
    title: "Privacy Policy",
    content: `
# 🦎 Privacy Policy - IguanaFlow

Last updated: 13.07.2025

---

## Who is the data controller?

The controller of your personal data is:  
Joanna Kokot Usługi Informatyczne                     
Tax ID: PL9161389290                   
E-mail: 📧 [hello@iguanaflow.com](mailto:hello@iguanaflow.com)

---

## What data do we collect?

We only collect data necessary for IguanaFlow to work properly:
- your email address (for login, notifications, contact),
- photos and videos of poses uploaded by users,
- info about your activity in the app (saved poses, friends you follow).

---

##  Why do we process your data?

We use your data to:
- create and manage your account,
- provide community features,
- improve content and app functionality,
- contact you for technical or service reasons.

---

## Who do we share data with?

We do not sell your data.  
We may share it only with:
- technical service providers (e.g. hosting, Stripe payments),
- if required by law.

---

## How long do we keep your data?

We keep your data as long as you use IguanaFlow.  
If you delete your account - we'll remove your data except where we must keep it for legal reasons.

---

## Your rights

You have the right to:
- access your data,
- correct it,
- delete it,
- restrict processing,
- transfer your data,
- file a complaint with your local data protection authority (e.g. in the EU: GDPR).

---

## Contact

Got questions? Reach out:  
📧 [hello@iguanaflow.com](mailto:hello@iguanaflow.com)
`,
  };

  const renderMarkdown = (content: string) => {
    return (
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-semibold mb-4 mt-8 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold text-white mb-3">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-muted-foreground mb-4">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-6 space-y-2 text-muted-foreground mb-4">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-muted-foreground">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="text-white font-semibold">{children}</strong>
            ),
            em: ({ children }) => <em className="text-primary">{children}</em>,
            code: ({ children }) => (
              <code className="bg-white/10 text-primary px-1 py-0.5 rounded text-sm">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-white/10 p-4 rounded-lg overflow-x-auto mb-4">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4">
                {children}
              </blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="p-6 pb-0">
        <Link to="/">
          <Button variant="ghost" className="text-white hover:bg-white/10 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="p-6 pt-0">
        <div className="max-w-4xl mx-auto">
          {renderMarkdown(content.content)}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 IguanaFlow. All rights reserved.
          </p>
          <div className="flex justify-center space-x-6 mt-4">
            <Link
              to="/privacy-policy"
              className="text-sm text-muted-foreground hover:text-purple-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-of-use"
              className="text-sm text-muted-foreground hover:text-purple-400 transition-colors"
            >
              Terms of Use
            </Link>
            <Link
              to="/about-us"
              className="text-sm text-muted-foreground hover:text-purple-400 transition-colors"
            >
              About Us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;

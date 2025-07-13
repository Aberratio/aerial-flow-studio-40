import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

const TermsOfUse = () => {
  const content = {
    title: "Terms of Use",
    content: `
# 🦎 Terms of Service - IguanaFlow

Last updated: 13.07.2025

---

## General provisions

1. These Terms of Service set out the rules for using the IguanaFlow app available at **[iguanaflow.com](https://iguanaflow.com)**.
2. The app is operated by:  
   Joanna Kokot Usługi Informatyczne                           
   Tax ID: PL9161389290                     
   Contact e-mail: 📧 [hello@iguanaflow.com](mailto:hello@iguanaflow.com)

---

## Conditions of use

1. Using the app requires creating an account.
2. Users must provide true and accurate information.
3. It is forbidden to post illegal, offensive or infringing content.
4. The administrator may block an account if the Terms are violated.

---

## Intellectual property

1. All content in the app (photos, videos, descriptions) is protected by copyright.
2. Copying, distributing or using content without permission is prohibited.
3. Content uploaded by users remains their property, but users grant a license for it to be displayed within the app.

---

## Payments

1. Some IguanaFlow features may be paid.
2. Payments are handled via Stripe.
3. Failure to pay for a subscription or course may limit access to paid content.

---

## Liability

1. The administrator is not responsible for content uploaded by users.
2. Users use the app at their own risk and should always exercise safely.

---

## Changes to the Terms

1. The administrator reserves the right to change the Terms.
2. Users will be informed about changes by e-mail or via the app.

---

## Contact

Questions? Contact us:  
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

export default TermsOfUse;

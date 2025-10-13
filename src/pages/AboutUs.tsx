import ReactMarkdown from "react-markdown";
import InfoPageLayout from "@/components/Layout/InfoPageLayout";

const AboutUs = () => {
  const content = {
    title: "About Us",
    content: `
# 🦎 About IguanaFlow

Welcome to **IguanaFlow** - a growing community and platform for aerial artists, pole dancers, and everyone who loves to fly.

---

## Our Mission

We believe aerial arts are for everyone - no matter if you're just learning your first figure or mastering advanced combos.  
**IguanaFlow** helps you:

- Explore a curated library of poses, tricks, and transitions.
- Find inspiration for your training.
- Connect with other aerialists around the world.
- Take on challenges and celebrate your progress.
- Unlock your flow - anytime, anywhere.

---

## What You'll Find Here

- **Library of Moves:** Clear photos, quick video demos, tips & variations.
- **Feed & Community:** Share your progress, ask for tips, cheer each other on.
- **Friends & Follows:** Build your aerial network - train together, stay inspired.
- **Badges & Challenges:** Gamify your journey, hit milestones, stay motivated.
- **Future Courses:** Soon you'll find full training programs created by real aerial instructors.

---

## Why Iguana?

The **iguana** is one of our favorite moves - but it's also a symbol: calm, strong, adaptable, always ready to climb higher. Just like you.

---

## Join the Flow

We're just getting started - and you can help shape this space!  
Upload figures, share ideas, become an early tester or a course creator.

Together, we'll make aerial knowledge more accessible, fun and organized - for every student and every teacher.

---

## Let's Connect

Got feedback, ideas or questions?  
DM us on Instagram [@iguana.flow](https://www.instagram.com/iguana.flow)  
or email us at [hello@iguanaflow.com](mailto:hello@iguanaflow.com).
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
    <InfoPageLayout>
      {renderMarkdown(content.content)}
    </InfoPageLayout>
  );
};

export default AboutUs;

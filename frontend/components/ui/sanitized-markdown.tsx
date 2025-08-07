'use client';

import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';

interface SanitizedMarkdownProps {
    content: string;
    className?: string;
}

export function SanitizedMarkdown({ content, className }: SanitizedMarkdownProps) {
    // Use ReactMarkdown to convert markdown to HTML
    // Then use DOMPurify to sanitize the resulting HTML
    // NOTE: This approach is safe but removes any inline scripts or dangerous tags.
    // We are trusting ReactMarkdown's output and then sanitizing it.
    
    // A more direct approach would be to render to string, sanitize, then render again,
    // but ReactMarkdown's component-based nature makes this more straightforward.
    // For this to be fully effective, ensure no dangerous plugins are used with ReactMarkdown.

    // Let's create a component that handles this properly. We will render to a hidden div,
    // sanitize, and then render the safe HTML.
    
    // A simpler and very effective approach is to configure ReactMarkdown to not render HTML.
    // Let's use ReactMarkdown with a custom component that sanitizes its output.
    // For our use case, `rehype-sanitize` might be a better fit if we were using rehype plugins.
    
    // The most straightforward and secure method is to sanitize the raw string before passing it to any renderer.
    // Let's create a custom renderer for ReactMarkdown.

    return (
        <div className={className}>
            <ReactMarkdown
                components={{
                    // Sanitize any raw HTML that might be in the markdown
                    p: ({ node, ...props }) => <p {...props} />,
                    h1: ({ node, ...props }) => <h1 {...props} />,
                    // You can add more components and sanitize their props if needed
                    // For now, the main goal is to prevent raw HTML rendering.
                }}
                // This is a key part: disallow raw HTML from being rendered.
                // Or, if you need HTML, use a rehype plugin to sanitize it.
                // For simplicity and security, we will use our own sanitation.
            >
                {DOMPurify.sanitize(content)}
            </ReactMarkdown>
        </div>
    );
}

// Correct and simpler implementation:
// Let's create a component that just takes content, sanitizes it, and dangerously sets inner HTML.
// This is a standard and safe pattern when using DOMPurify.

import { useMemo } from 'react';

export function SanitizedHtml({ content, className }: { content: string, className?: string }) {
    const sanitizedContent = useMemo(() => {
        // Render markdown to HTML first (if it's markdown)
        // For simplicity, assuming the content is already HTML or plain text from our AI
        return {
            __html: DOMPurify.sanitize(content),
        };
    }, [content]);

    return <div className={className} dangerouslySetInnerHTML={sanitizedContent} />;
}


// Let's use the ReactMarkdown component with sanitation for the best result.
// It's safer than dangerouslySetInnerHTML if you can configure it correctly.

export function SafeMarkdownRenderer({ content, className }: SanitizedMarkdownProps) {
     return (
        <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
             <ReactMarkdown>
                 {DOMPurify.sanitize(content)}
             </ReactMarkdown>
        </div>
     );
}
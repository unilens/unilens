// src/sanitize.ts
import sanitizeHtml from 'sanitize-html';

export function sanitizePortfolio(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      'h1','h2','h3','p','br','hr','strong','em','u','s',
      'ul','ol','li','a','img','blockquote','span','div','section'
    ],
    allowedAttributes: {
      'a':   ['href', 'title'],
      'img': ['src', 'alt', 'width', 'height'],
      '*':   ['class', 'style']
    },
    allowedStyles: {
      '*': {
        'color':       [/.*/],
        'font-size':   [/.*/],
        'text-align':  [/.*/],
        'background-color': [/.*/]
      }
    },
    // Explicitly block everything dangerous <>
    disallowedTagsMode: 'discard'
  });
}
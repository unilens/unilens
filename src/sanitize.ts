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
        'display':               [/^(grid|inline-grid|flex|inline-flex|block|inline-block)$/],
        'grid-template-columns': [/.*/],
        'grid-template-rows':    [/.*/],
        'grid-template-areas':   [/.*/],
        'grid-column':           [/.*/],
        'grid-row':              [/.*/],
        'grid-gap':              [/.*/],
        'gap':                   [/.*/],
        'column-gap':            [/.*/],
        'row-gap':               [/.*/],
        'align-items':           [/.*/],
        'justify-items':         [/.*/],
        'justify-content':       [/.*/],
        'align-content':         [/.*/],
        'place-items':           [/.*/],
        'grid-auto-flow':        [/.*/],
        'grid-auto-columns':     [/.*/],
        'grid-auto-rows':        [/.*/],
        'font-weight':    [/.*/],
        'margin':         [/.*/],
        'padding':        [/.*/],
        'border-radius':  [/.*/],
        'flex-direction': [/.*/],
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
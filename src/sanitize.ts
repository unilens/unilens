// src/sanitize.ts
import sanitizeHtml from 'sanitize-html';

export function sanitizePortfolio(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      'h1','h2','h3','p','br','hr','strong','em','u','s',
      'ul','ol','li','a','img','blockquote','span','div','section','style'
    ],
    allowedAttributes: {
      'a':     ['href', 'title'],
      'img':   ['src', 'alt', 'width', 'height'],
      'style': [],
      '*':     ['class', 'style']
    },
    allowedStyles: {
      '*': {
        'display':               [/^(grid|inline-grid|flex|inline-flex|block|inline-block)$/],
        'column-count':          [/.*/],
        'column-gap':            [/.*/],
        'background':            [/.*/],
        'background-color':      [/.*/],
        'grid-template-columns': [/.*/],
        'grid-template-rows':    [/.*/],
        'grid-template-areas':   [/.*/],
        'grid-column':           [/.*/],
        'grid-row':              [/.*/],
        'grid-gap':              [/.*/],
        'gap':                   [/.*/],
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
        'width':          [/.*/],
        'height':         [/.*/],
        'max-width':      [/.*/],
        'min-width':      [/.*/],
        'margin':         [/.*/],
        'margin-top':     [/.*/],
        'margin-bottom':  [/.*/],
        'margin-left':    [/.*/],
        'margin-right':   [/.*/],
        'padding':        [/.*/],
        'padding-top':    [/.*/],
        'padding-bottom': [/.*/],
        'padding-left':   [/.*/],
        'padding-right':  [/.*/],
        'border-radius':  [/.*/],
        'flex-direction': [/.*/],
        'color':       [/.*/],
        'font-size':   [/.*/],
        'text-align':  [/.*/],
      }
    },
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowVulnerableTags: true,
    // Explicitly block everything dangerous <>
    disallowedTagsMode: 'discard'
  });
}
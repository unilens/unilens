// src/sanitize.ts
import sanitizeHtml from 'sanitize-html';

/** Strip dangerous patterns from raw CSS text inside <style> blocks */
function sanitizeCssContent(css: string): string {
  return css
    .replace(/@import\b[^;]*;?/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/behavior\s*:/gi, '')
    .replace(/-moz-binding\s*:/gi, '')
    // Block url() loads except data:image (needed for inline background images)
    .replace(/url\s*\(\s*(['"]?)(?!data:image\/)([^)'"]*)\1\s*\)/gi, 'url("")');
}

export function sanitizePortfolio(dirty: string): string {
  const sanitized = sanitizeHtml(dirty, {
    allowedTags: [
      'h1','h2','h3','p','br','hr','strong','em','u','s',
      'ul','ol','li','a','img','blockquote','span','div','section','style'
    ],
    allowedAttributes: {
      'a':     ['href', 'title', 'target'],
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
    allowVulnerableTags: true, // required for <style> raw text; CSS is sanitized below
    disallowedTagsMode: 'discard',
    transformTags: {
      // Force safe link behaviour — prevents tab-napping via target="_blank"
      'a': (_tagName, attribs) => ({
        tagName: 'a',
        attribs: { ...attribs, rel: 'noopener noreferrer' },
      }),
    },
  });

  // Post-process <style> block contents to strip dangerous CSS patterns
  return sanitized.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (_m, attrs, css) =>
    `<style${attrs}>${sanitizeCssContent(css)}</style>`
  );
}
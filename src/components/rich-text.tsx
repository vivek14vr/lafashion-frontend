import type { ReactNode } from 'react'
import type { LexicalContent, LexicalNode } from '@/lib/types'

const IS_BOLD = 1
const IS_ITALIC = 2
const IS_STRIKETHROUGH = 4
const IS_UNDERLINE = 8
const IS_CODE = 16

function renderText(node: LexicalNode, key: string): ReactNode {
  let content: ReactNode = node.text ?? ''
  const format = typeof node.format === 'number' ? node.format : 0

  if (format & IS_CODE) content = <code key={`${key}-code`}>{content}</code>
  if (format & IS_BOLD) content = <strong key={`${key}-bold`}>{content}</strong>
  if (format & IS_ITALIC) content = <em key={`${key}-italic`}>{content}</em>
  if (format & IS_UNDERLINE) content = <u key={`${key}-u`}>{content}</u>
  if (format & IS_STRIKETHROUGH) content = <s key={`${key}-s`}>{content}</s>

  return <span key={key}>{content}</span>
}

function renderChildren(nodes: LexicalNode[] | undefined, keyPrefix: string): ReactNode[] {
  if (!nodes?.length) return []
  return nodes.map((node, index) => renderNode(node, `${keyPrefix}-${index}`))
}

function renderNode(node: LexicalNode, key: string): ReactNode {
  switch (node.type) {
    case 'text':
      return renderText(node, key)
    case 'linebreak':
      return <br key={key} />
    case 'paragraph':
      return (
        <p key={key} className="mb-4 last:mb-0">
          {renderChildren(node.children, key)}
        </p>
      )
    case 'heading': {
      const Tag = (node.tag === 'h1' || node.tag === 'h2' || node.tag === 'h3' || node.tag === 'h4'
        ? node.tag
        : 'h2') as 'h1' | 'h2' | 'h3' | 'h4'
      const sizes = {
        h1: 'text-3xl md:text-4xl',
        h2: 'text-2xl md:text-3xl',
        h3: 'text-xl md:text-2xl',
        h4: 'text-lg md:text-xl',
      }
      return (
        <Tag
          key={key}
          className={`mb-4 font-[family-name:var(--font-display)] text-[var(--cream)] ${sizes[Tag]}`}
        >
          {renderChildren(node.children, key)}
        </Tag>
      )
    }
    case 'list': {
      const Tag = node.listType === 'number' ? 'ol' : 'ul'
      return (
        <Tag
          key={key}
          className={`mb-4 space-y-2 pl-5 text-[var(--cream)]/85 ${
            Tag === 'ol' ? 'list-decimal' : 'list-disc'
          }`}
        >
          {renderChildren(node.children, key)}
        </Tag>
      )
    }
    case 'listitem':
      return <li key={key}>{renderChildren(node.children, key)}</li>
    case 'quote':
      return (
        <blockquote
          key={key}
          className="mb-4 border-l border-[var(--champagne)]/50 pl-4 text-[var(--cream)]/75 italic"
        >
          {renderChildren(node.children, key)}
        </blockquote>
      )
    case 'link':
      return (
        <a
          key={key}
          href={node.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--champagne)] underline-offset-4 hover:underline"
        >
          {renderChildren(node.children, key)}
        </a>
      )
    default:
      if (node.children?.length) {
        return <div key={key}>{renderChildren(node.children, key)}</div>
      }
      return null
  }
}

export function RichText({ content }: { content?: LexicalContent }) {
  const children = content?.root?.children
  if (!children?.length) return null

  return (
    <div className="mt-8 space-y-1 text-base leading-relaxed text-[var(--cream)]/85 md:text-lg">
      {renderChildren(children, 'rt')}
    </div>
  )
}

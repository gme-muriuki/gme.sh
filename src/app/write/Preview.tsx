import type { ReactNode } from 'react'
import type { RawMdxFrontmatter } from '*.mdx'
import { PostLayout, combineFrontmatter } from '@/app/post/PostLayout'
import type { PostType } from '@/app/content-index'

type Props = {
  type: PostType
  frontmatter: Partial<RawMdxFrontmatter>
  children: ReactNode
}

const PREVIEW_PERMALINK = '/write/preview'

/**
 * Render a post inside PostLayout configured for previewing.
 *
 * Combines the provided frontmatter with defaults for the given post `type` and renders
 * `children` within a PostLayout that uses the fixed preview permalink.
 *
 * @param type - The post category used to derive default frontmatter
 * @param frontmatter - Partial MDX frontmatter to merge with defaults for the given `type`
 * @param children - Content to render inside the preview layout
 * @returns A React element that displays the post content within the preview PostLayout
 */
export function Preview({ type, frontmatter, children }: Props) {
  const fm = combineFrontmatter(type, frontmatter)
  return (
    <PostLayout frontmatter={fm} permalink={PREVIEW_PERMALINK}>
      {children}
    </PostLayout>
  )
}

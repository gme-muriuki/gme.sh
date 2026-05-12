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

export function Preview({ type, frontmatter, children }: Props) {
  const fm = combineFrontmatter(type, frontmatter)
  return (
    <PostLayout frontmatter={fm} permalink={PREVIEW_PERMALINK}>
      {children}
    </PostLayout>
  )
}

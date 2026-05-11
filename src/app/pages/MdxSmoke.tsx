import Smoke, { frontmatter } from '@/content/_smoke.mdx'
import { EssayLayout } from '@/app/post/EssayLayout'

// Temporary smoke route — exercises the full essay pipeline end-to-end
// (layout + components + MDX). Removed in commit 10.
export default function MdxSmoke() {
  return (
    <EssayLayout
      title={frontmatter.title}
      dek={frontmatter.dek}
      date={frontmatter.date}
      readingTime={11}
      tags={['rust', 'allocators', 'systems']}
      series={{ name: 'Writing an allocator', index: 2, total: 4 }}
      permalink="/_smoke"
    >
      <Smoke />
    </EssayLayout>
  )
}

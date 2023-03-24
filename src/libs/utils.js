import { parse } from "./marked-renderer.js"

export async function parseContent(content, coverProp = "cover") {
  const props = Array.from(content.matchAll(/^(.+):: (.+)$/gm)).map((m) => [
    m[1],
    m[2],
  ])

  const tags = new Set(
    Array.from(
      content.matchAll(/(?:^|\s)#(?:(?:\[\[((?:[^\]]|\](?!\]))+)\]\])|(\S+))/g),
    ).map((m) => m[1] ?? m[2]),
  )

  const coverIndex = props.findIndex(([k]) => k === coverProp)
  const cover = coverIndex > -1 ? await getImgSrc(props[coverIndex][1]) : null
  if (coverIndex > -1) {
    props.splice(coverIndex, 1)
  }

  const scheduled = content.match(/\nSCHEDULED: <([^>]+)>/)?.[1]
  const deadline = content.match(/\nDEADLINE: <([^>]+)>/)?.[1]

  // Use only the first line.
  content = content.match(/.*/)[0]

  // Remove macro renderers.
  content = content.replace(/ \{\{renderer (?:\}[^\}]|[^\}])+\}\}/g, "")

  // Handle markdown.
  content = parse(content)

  // Replace block refs with their content.
  let match
  while ((match = /(?:\(\()(?!\()([^\)]+)\)\)/g.exec(content)) != null) {
    const start = match.index
    const end = start + match[0].length
    const refUUID = match[1]
    try {
      const refBlock = await logseq.Editor.getBlock(refUUID)
      const refFirstLine = refBlock.content.match(/.*/)[0]
      const refContent = await parseContent(refFirstLine, coverProp)
      content = `${content.substring(0, start)}${refContent}${content.substring(
        end,
      )}`
    } catch (err) {
      // ignore err
      break
    }
  }

  // Remove tags.
  content = content.replace(/(^|\s)#((\[\[([^\]]|\](?!\]))+\]\])|\S+)/g, "")

  // Remove page refs
  content = content.replace(/\[\[([^\]]+)\]\]/g, "$1")

  return [content.trim(), tags, props, cover, scheduled, deadline]
}

export async function persistBlockUUID(uuid) {
  const block = await logseq.Editor.getBlock(uuid)
  if (block.properties?.id == null) {
    await logseq.Editor.updateBlock(
      block.uuid,
      `${block.content}\nid:: ${block.uuid}`,
    )
  }
}

export async function getImgSrc(src) {
  const m = src.match(
    /^!?(?:\[[^\]]+\])?(?:\((?:\.\.\/)?(.+)\)|(?:(?:\.\.\/)?(.+)))/,
  )
  if (m) {
    src = m[1] ?? m[2]
  }
  const graph = await logseq.App.getCurrentGraph()
  if (src.startsWith("http")) {
    return src
  } else if (src.startsWith("/") || src.match(/^[a-z]:\\/i)) {
    return `file://${src}`
  } else {
    return `file://${graph.path}/${src}`
  }
}

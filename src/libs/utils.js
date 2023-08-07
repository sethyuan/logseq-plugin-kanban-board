import { parse } from "./marked-renderer.js"

export async function parseContent(content, coverProp = "cover") {
  const propsPattern = /^(.+):: (.+)$/gm
  const props = Array.from(content.matchAll(propsPattern)).map((m) => [
    m[1],
    m[2],
  ])
  content = content.replace(propsPattern, "").trimEnd()

  const tags = new Set(
    Array.from(
      content.matchAll(/(?:^|\s)#(?:(?:\[\[((?:[^\]]|\](?!\]))+)\]\])|(\S+))/g),
    ).map((m) => m[1] ?? m[2]),
  )

  const tagsPropIndex = props.findIndex(([k]) => k === "tags")
  if (tagsPropIndex > -1) {
    const [, tagsPropValue] = props[tagsPropIndex]
    for (const t of tagsPropValue.split(/,，/)) {
      tags.add(t.replace(/^\s*\[\[((?:[^\]]|\](?!\]))+)\]\]\s*$/, "$1"))
    }
    props.splice(tagsPropIndex, 1)
  }

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
      const [refContent] = await parseContent(refFirstLine, coverProp)
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

  // Remove marker
  content = content.replace(
    /^(?:LATER|NOW|TODO|DOING|DONE|WAITING|CANCELED) /g,
    "",
  )

  return [content.trim(), tags, props, cover, scheduled, deadline]
}

export async function persistBlockUUID(uuid) {
  if (!(await logseq.Editor.getBlockProperty(uuid, "id"))) {
    await logseq.Editor.upsertBlockProperty(uuid, "id", uuid)
  }
}

export async function getImgSrc(src) {
  const m = src.match(
    /^!?(?:\[[^\]]*\])?(?:\((?:\.\.\/)?(.+)\)|(?:(?:\.\.\/)?(.+)))/,
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

export function groupBy(arr, selector) {
  const ret = {}
  for (const x of arr) {
    const k = selector(x)
    if (!k) {
      if (ret["(ungrouped)"] == null) {
        ret["(ungrouped)"] = []
      }
      ret["(ungrouped)"].push(x)
    } else {
      const key = Array.isArray(k) ? `[[${k[0]}]]` : k
      if (ret[key] == null) {
        ret[key] = []
      }
      ret[key].push(x)
    }
  }
  return ret
}

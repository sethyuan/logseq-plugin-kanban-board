中文 | [English](README.en.md)

# logseq-plugin-kanban-board

可拖拽、可编辑的看板视图。

## 使用展示

https://user-images.githubusercontent.com/3410293/227445820-d357f604-fc9a-4771-aecc-d07431b21ee6.mp4

![Cover](https://user-images.githubusercontent.com/3410293/229694906-398dba92-f208-482e-9cda-26e4dd466e80.png)

## 功能

- 使用 Logseq 列表数据创建看板。
- 可直接在看板列表中新建列表及卡片。
- 在看板名和列表名上点击可重命名。
- 点击卡片可在右侧边栏打开卡片对应的块。
- 拖动卡片可在不同的列表间排序。
- 拖动列表可对列表排序。
- 卡片支持右键菜单，涵盖了一些常见操作。
- 卡片支持设置封面图，默认会使用卡片的 `cover` 属性。也可以提供一个第三个参数给 renderer 来自定义属性。
  ```
  {{renderer :kboard, ((board block ref)), list, bg}}
  ```
  这里 `bg` 就是有封面图片地址的属性。封面图可以给 Logseq 中的相对地址也可以给本机的绝对地址或者一个 URL。
- 卡片在每个列表的时长追踪。
- 可筛选看板的数据。
- 可对卡片和列表进行手动归档，也可设置自动归档。
- 支持将任务类型的高级查询显示为看板，这种看板没有正常看板的功能全。

## 对列表数据格式的要求

插件反映的是以下数据格式的视图，请参照使用。

```
- board
  - item a
    prop:: list a
  - item b
    prop:: list b
```

利用 "board" 的块引用和 "prop" 属性（当然也可以是其它名字的属性）创建出的看板视图会由两个列表组成，分别是 "list a" 和 "list b"。

## 创建看板

有以下几种方式可以创建一个看板：

1. 通过斜线命令 `/Kanban Board`，在打开的输入框中输入以上数据格式的块引用和属性名。
1. 在根块上（以上示例中为 "board"）点击小圆点打开上下文菜单，选择 `创建看板`，在打开的输入框中输入属性名，块引用已自动填充好。
1. 通过斜线命令 `/Kanban Board (Empty)`，插件会自动帮你创建一个空白看板以及其对应的数据。
1. 通过斜线命令 `/Kanban Board (Marker Query)`，插件会自动帮你创建一个基于返回任务的高级查询的看板。第一个参数为看板名称，其余参数为想要作为列表显示的任务状态。

## NOTE

推荐设置 Logseq 隐藏`duration`属性，这样看起来会更整洁些。在`config.edn`中设置，参考：

```
 ;; hide specific properties for blocks
 ;; E.g. #{:created-at :updated-at}
 :block-hidden-properties #{:duration}
```

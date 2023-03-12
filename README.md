中文 | [English](README.en.md)

# logseq-plugin-kanban-board

可拖拽、可编辑的看板视图。

## 使用展示

https://user-images.githubusercontent.com/3410293/224529450-386f89a8-7449-4a7b-8cb0-159be587087f.mp4

## 功能

- 使用 Logseq 列表数据创建看板。
- 可直接在看板列表中新建卡片。
- 点击卡片可在右侧边栏打开卡片对应的块。
- 拖动卡片可在不同的列表间排序。
- 拖动列表可对列表排序。

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

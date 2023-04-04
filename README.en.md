[中文](README.md) | English

# logseq-plugin-kanban-board

Draggable, editable Kanban view.

## Usage

https://user-images.githubusercontent.com/3410293/227445820-d357f604-fc9a-4771-aecc-d07431b21ee6.mp4

## Features

- Create Kanban boards using Logseq list data.
- New lists and cards can be created directly within the Kanban list.
- You rename the board and the lists by just clicking on them.
- Click on a card to open the block corresponding to the card in the right sidebar.
- Drag a card to sort between the different lists.
- Drag a list to sort the lists.
- Cards have a context menu with frequently used operations.
- Cards support setting the cover image, by default the `cover` property of the card will be used. It is also possible to provide a 3rd parameter to the renderer to customize the property.
  ```
  {{renderer :kboard, ((board block ref)), list, bg}}
  ```
  Here `bg` is the property with the image path. The image path can be a relative path in Logseq or a local absolute path or an URL.
- Tracking of card's duration in each list.
- You can filter the board's data.
- Archiving of cards and lists, both manually or automatically.

## List data structure

The plugin is a view reflecting the data of the following structure.

```
- board
  - item a
    prop:: list a
  - item b
    prop:: list b
```

The Kanban view created using the "board" block reference and the "prop" attribute (which can of course be any other name) will have two lists, "list a" and "list b".

## Creating a Kanban

There are 3 ways to create a Kanban:

1. Using the slash command `/Kanban Board`, input the block reference and the property name in above data format in the dialog that opens.
1. Click the dot on the root block (`board` in the above example) to open the context menu, select `Kanban Board`, and input the property name in the dialog that opens, the block reference is filled for you automatically.
1. Using the slash command `/Kanban Board (Empty)`, the plugin will automatically create an empty kanban board and its data for you.

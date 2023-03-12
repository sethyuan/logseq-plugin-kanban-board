[中文](README.md) | English

# logseq-plugin-kanban-board

Draggable, editable Kanban view.

## Usage

https://user-images.githubusercontent.com/3410293/224529450-386f89a8-7449-4a7b-8cb0-159be587087f.mp4

## Features

- Create Kanban boards using Logseq list data.
- New cards can be created directly in the Kanban list.
- Click on a card to open the block corresponding to the card in the right sidebar.
- Drag a card to sort between the different lists.
- Drag a list to sort the lists.

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

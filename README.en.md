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
- Cards have a context menu with frequently used operations.

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
1. Using the slash command `/Kanban Board (Sample)`, the plugin will automatically create a sample kanban board and its corresponding data for you.

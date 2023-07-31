[中文](README.md) | English

# logseq-plugin-kanban-board

Draggable, editable Kanban view.

## Usage

https://user-images.githubusercontent.com/3410293/227445820-d357f604-fc9a-4771-aecc-d07431b21ee6.mp4

![Cover](https://user-images.githubusercontent.com/3410293/229694906-398dba92-f208-482e-9cda-26e4dd466e80.png)

https://github.com/sethyuan/logseq-plugin-kanban-board/assets/3410293/d89016eb-6dae-48fe-a725-941128777897

https://github.com/sethyuan/logseq-plugin-kanban-board/assets/3410293/a2d99736-831f-4006-8c26-2e8210fc6e4e

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
- Support displaying task queries as kanban, this kanban does not have full functionality like a normal kanban. Logseq plugins don't support arguments passing to queries, please be advised.
- Support displaying normal queries as kanban, this kanban does not have full functionality like a normal kanban. Logseq plugins don't support arguments passing to queries, please be advised.
- Support setting the width of each column, you can use `px` and `%` as units.
  ```
  {{renderer :kboard, ((board block ref)), list, cover, 49%}}
  {{renderer :kboard-query, name, list, list a,  list b, 49%}}
  {{renderer :kboard-marker-query, name, LATER, NOW, DONE, 49%}}
  ```

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
1. Using the slash command `/Kanban Board (Query)`, the plugin will automatically create a Kanban board based on an query that returns blocks. The first parameter is the name of the Kanban board, the second parameter is the property to be used as lists, the remaining parameters are the property values that you want to display as lists, column width can be given as the last parameter (must end with either 'px' or '%').
1. Using the slash command `/Kanban Board (Task Query)`, the plugin will automatically create a Kanban board based on an query that returns tasks. The first parameter is the name of the Kanban board, the remaining parameters are the task status that you want to display as lists, column width can be given as the last parameter (must end with either 'px' or '%').

## NOTE

It is recommended to hide the `duration` property, which will make it look neater. Set it in the `config.edn`, like this:

```
 ;; hide specific properties for blocks
 ;; E.g. #{:created-at :updated-at}
 :block-hidden-properties #{:duration}
```

## Buy me a coffee

If you think the software I have developed is helpful to you and would like to give recognition and support, you may buy me a coffee using following link. Thank you for your support and attention.

<a href="https://www.buymeacoffee.com/sethyuan" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

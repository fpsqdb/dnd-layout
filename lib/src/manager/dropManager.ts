import type { LayoutItem, RenderItem } from "../core/types";
import type { DropStore } from "../store/dropStore";
import type { LayoutStore } from "../store/layoutStore";
import { MoveManager } from "./moveManager";

type DropState =
    | {
          isDropping: false;
          droppingId: string | null;
      }
    | {
          isDropping: true;
          droppingId: string;
      };

export type DragManagerUpdateCallback<T extends LayoutItem> = (items: T[]) => void;

export class DropManager<T extends LayoutItem> {
    #counter = 0;
    #layoutStore: LayoutStore<T>;
    #unsubscribeLayoutStore: (() => void) | null = null;
    #dropStore: DropStore<T>;
    #dropState: DropState = { isDropping: false, droppingId: null };
    #watchUnexpectedDragEndDispose: (() => void) | null = null;
    #dragOverFired = false;
    #layoutItems: RenderItem<T>[] = [];
    #moveManager: MoveManager<T>;

    constructor(layoutStore: LayoutStore<T>, dropStore: DropStore<T>) {
        this.#layoutStore = layoutStore;
        this.#layoutItems = layoutStore.getSnapshot().layoutItems;
        this.#dropStore = dropStore;
        this.#moveManager = new MoveManager(layoutStore);
    }

    subscribeLayoutStore = (): void => {
        this.unsubscribeLayoutStore();
        this.#unsubscribeLayoutStore = this.#layoutStore.subscribe(() => {
            this.#layoutItems = this.#layoutStore.getSnapshot().layoutItems;
            const dropState = this.#dropState;
            if (dropState.isDropping) {
                const targetItem = this.#layoutItems.find((item) => item.data.id === dropState.droppingId);
                this.#dropStore.setPlaceholder(targetItem);
            }
        });
    };

    unsubscribeLayoutStore = (): void => {
        this.#unsubscribeLayoutStore?.();
    };

    setLayoutStore = (layoutStore: LayoutStore<T>): boolean => {
        if (!layoutStore) {
            return false;
        }
        if (this.#layoutStore === layoutStore) {
            return false;
        }
        this.#layoutStore = layoutStore;
        this.#layoutItems = layoutStore.getSnapshot().layoutItems;
        if (this.#dropState.isDropping) {
            this.#layoutStore.pauseUpdateItems();
        }
        return true;
    };

    setContainer = (container: HTMLElement): void => {
        this.#moveManager.setContainer(container);
    };

    handleExternalDragEnter = (
        e: React.DragEvent,
        getItem?: (event: React.DragEvent, id: string) => T | false,
    ): boolean => {
        if (this.#dropState.isDropping) {
            return false;
        }
        const item = getItem?.(e, this.#getDroppingItemId());
        if (!item) {
            return false;
        }

        this.#dropState = {
            isDropping: true,
            droppingId: item.id,
        };
        this.#dragOverFired = true;

        this.#startExternalDrag(item, e);
        this.#watchUnexpectedDragEnd();

        return true;
    };

    handleExternalDragOver = (e: Pick<PointerEvent, "clientX" | "clientY">): void => {
        this.#dragOverFired = true;
        if (!this.#dropState.isDropping) {
            return;
        }

        this.#rafMove(this.#dropState.droppingId, e);
    };

    handleExternalDragLeave = (): void => {
        this.#removeDroppingItem();
        this.#stopExternalDrag();
        this.#unwatchUnexpectedDragEnd();
    };

    handleExternalDrop = (e: React.DragEvent, getItem?: (event: React.DragEvent, item: T) => T | false): void => {
        const dropState = this.#dropState;
        if (!dropState.isDropping) {
            return;
        }
        const items = this.#layoutStore.getSnapshot().items;
        const itemIndex = items.findIndex((item) => item.id === dropState.droppingId);
        if (itemIndex < 0) {
            return;
        }
        const newItem = getItem?.(e, items[itemIndex]);
        if (newItem) {
            const newItems = [...items];
            newItems.splice(itemIndex, 1, newItem);
            this.#layoutStore.setInternalItems(newItems);
        } else {
            this.#removeDroppingItem();
        }
        this.#stopExternalDrag();
        this.#unwatchUnexpectedDragEnd();
    };

    #getDroppingItemId = (): string => {
        this.#counter++;
        return `dnd-layout-dropping-item-${this.#counter}`;
    };

    #removeDroppingItem = (): void => {
        const dropState = this.#dropState;
        if (!dropState.isDropping) {
            return;
        }
        const items = this.#layoutStore.getSnapshot().items;
        const index = items.findIndex((item) => item.id === dropState.droppingId);
        if (index >= 0) {
            const newItems = [...items];
            newItems.splice(index, 1);
            this.#layoutStore.setInternalItems(newItems);
        }
    };

    #startExternalDrag = (droppingItem: T, pointer: Pick<PointerEvent, "clientX" | "clientY">): void => {
        this.#layoutStore.addSkipRenderId(droppingItem.id);
        const items = this.#layoutStore.getSnapshot().items;
        const newItems = [droppingItem, ...items];
        const layoutAlgorithm = this.#layoutStore.getLayoutAlgorithm();
        const config = this.#layoutStore.getConfig();
        const renderItems = layoutAlgorithm.layout(newItems, config);

        // biome-ignore lint/style/noNonNullAssertion: <insertedItem should never be null>
        const insertedItem = renderItems.find((item) => item.data.id === droppingItem.id)!;
        this.#moveManager.startMove(insertedItem);

        const moved = this.#moveManager.move(renderItems, droppingItem.id, pointer);
        if (!moved) {
            this.#layoutStore.setInternalItems(newItems);
        }

        const targetItem = this.#layoutItems.find((item) => item.data.id === droppingItem.id);
        this.#dropStore.batchUpdate(() => {
            this.#dropStore.setIsDropping(true);
            this.#dropStore.setDroppingId(droppingItem.id);
            this.#dropStore.setPlaceholder(targetItem);
        });
        this.#layoutStore.pauseUpdateItems();
    };

    #stopExternalDrag = (): void => {
        this.#layoutStore.clearSkipRenderIds();
        this.#layoutStore.resumeUpdateItems();
        if (this.#dropState.isDropping) {
            this.#dropStore.reset();
        }

        this.#moveManager.stopMove();
        this.#dropState = { isDropping: false, droppingId: null };
    };

    #watchUnexpectedDragEnd = (): void => {
        this.#unwatchUnexpectedDragEnd();

        const timer = setInterval(() => {
            if (this.#dropState.isDropping) {
                if (!this.#dragOverFired) {
                    this.#removeDroppingItem();
                    this.#stopExternalDrag();
                }
            } else {
                this.#unwatchUnexpectedDragEnd();
            }
            this.#dragOverFired = false;
        }, 200);

        this.#watchUnexpectedDragEndDispose = () => {
            clearInterval(timer);
        };
    };

    #unwatchUnexpectedDragEnd = (): void => {
        if (this.#watchUnexpectedDragEndDispose) {
            this.#watchUnexpectedDragEndDispose();
            this.#watchUnexpectedDragEndDispose = null;
        }
    };

    #rafMove = (draggingId: string, pointer: Pick<PointerEvent, "clientX" | "clientY">): void => {
        this.#moveManager.rafMove(this.#layoutItems, draggingId, pointer);
    };
}

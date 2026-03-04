import type { LayoutItem, RenderItem } from "../core/types";
import { isDeepEqual } from "../core/utils";
import { Store } from "./store";

export type DragStoreValue<T extends LayoutItem> = {
    isDragging: boolean;
    isReturning: boolean;
    fixedReturnPosition: Pick<RenderItem<LayoutItem>, "left" | "top"> | null;
    draggingId: string | null;
    placeholder: RenderItem<T> | null;
};

export class DragStore<T extends LayoutItem> extends Store<DragStoreValue<T>> {
    #storeValue: DragStoreValue<T> = {
        isDragging: false,
        isReturning: false,
        fixedReturnPosition: null,
        draggingId: null,
        placeholder: null,
    };

    getSnapshot = (): DragStoreValue<T> => {
        return this.#storeValue;
    };

    setIsDragging = (isDragging: boolean): void => {
        if (this.#storeValue.isDragging === isDragging) {
            return;
        }
        this.#storeValue = {
            ...this.#storeValue,
            isDragging,
        };
        this._notify();
    };

    setIsReturning = (isReturning: boolean): void => {
        if (this.#storeValue.isReturning === isReturning) {
            return;
        }
        this.#storeValue = {
            ...this.#storeValue,
            isReturning,
        };
        this._notify();
    };

    setFixedReturnPosition = (fixedReturnPosition: Pick<RenderItem<LayoutItem>, "left" | "top"> | null): void => {
        if (isDeepEqual(this.#storeValue.fixedReturnPosition, fixedReturnPosition)) {
            return;
        }
        this.#storeValue = {
            ...this.#storeValue,
            fixedReturnPosition,
        };
        this._notify();
    };

    setDraggingId = (draggingId: string | null): void => {
        if (this.#storeValue.draggingId === draggingId) {
            return;
        }
        this.#storeValue = {
            ...this.#storeValue,
            draggingId,
        };
        this._notify();
    };

    setPlaceholder = (placeholder: RenderItem<T> | null | undefined): void => {
        const newPlaceholder = placeholder ?? null;
        if (this.#storeValue.placeholder === newPlaceholder) {
            return;
        }
        this.#storeValue = {
            ...this.#storeValue,
            placeholder: newPlaceholder,
        };
        this._notify();
    };

    reset = (): void => {
        this.#storeValue = {
            isDragging: false,
            isReturning: false,
            fixedReturnPosition: null,
            draggingId: null,
            placeholder: null,
        };
        this._notify();
    };

    _beforeBatchOrDelayNotify = (): void => {
        void 0;
    };
}

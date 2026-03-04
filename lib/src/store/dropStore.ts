import type { LayoutItem, RenderItem } from "../core/types";
import { Store } from "./store";

export type DropStoreValue<T extends LayoutItem> = {
    isDropping: boolean;
    droppingId: string | null;
    placeholder: RenderItem<T> | null;
};

export class DropStore<T extends LayoutItem> extends Store<DropStoreValue<T>> {
    #storeValue: DropStoreValue<T> = {
        isDropping: false,
        droppingId: null,
        placeholder: null,
    };

    getSnapshot = (): DropStoreValue<T> => {
        return this.#storeValue;
    };

    setIsDropping = (isDropping: boolean): void => {
        if (this.#storeValue.isDropping === isDropping) {
            return;
        }
        this.#storeValue = {
            ...this.#storeValue,
            isDropping,
        };
        this._notify();
    };

    setDroppingId = (draggingId: string | null): void => {
        if (this.#storeValue.droppingId === draggingId) {
            return;
        }
        this.#storeValue = {
            ...this.#storeValue,
            droppingId: draggingId,
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
            isDropping: false,
            droppingId: null,
            placeholder: null,
        };
        this._notify();
    };

    _beforeBatchOrDelayNotify = (): void => {
        void 0;
    };
}

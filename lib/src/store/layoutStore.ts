import { DEFAULT_LAYOUT_RENDER_CONFIG } from "../core/constants";
import type {
    LayoutAlgorithm,
    LayoutItem,
    LayoutRenderConfig,
    MeasuredLayoutItem,
    RenderItem,
    Size,
} from "../core/types";
import { getContainerBoxMetrics, getContainerSize, isDeepEqual, syncLayoutItems } from "../core/utils";
import { Store } from "./store";

export type LayoutStoreValue<T extends LayoutItem> = {
    items: MeasuredLayoutItem<T>[];
    renderItems: RenderItem<MeasuredLayoutItem<T>>[];
    layoutItems: RenderItem<MeasuredLayoutItem<T>>[];
    containerSize: Size;
};

export class LayoutStore<T extends LayoutItem> extends Store<LayoutStoreValue<T>> {
    #storeValue: LayoutStoreValue<T>;
    #config: LayoutRenderConfig = DEFAULT_LAYOUT_RENDER_CONFIG;
    #container: HTMLElement | null = null;
    #skipRenderIds: Set<string> = new Set();
    #pendingItems: T[] | null = null;
    #isUpdateItemsPaused = false;
    #layoutAlgorithm: LayoutAlgorithm<T>;
    constructor(initialItems: T[], algorithm: LayoutAlgorithm<T>) {
        super();
        this.#storeValue = {
            items: structuredClone(initialItems),
            renderItems: [],
            layoutItems: [],
            containerSize: { width: 0, height: 0 },
        };
        this.#layoutAlgorithm = algorithm;
    }

    getSnapshot = (): LayoutStoreValue<T> => {
        return this.#storeValue;
    };

    pauseUpdateItems = (): void => {
        this.#isUpdateItemsPaused = true;
    };

    resumeUpdateItems = (): void => {
        this.#isUpdateItemsPaused = false;
        if (this.#pendingItems) {
            this.#storeValue = {
                ...this.#storeValue,
                items: this.#pendingItems,
            };
            this.#pendingItems = null;
            this.#syncLayout();
            this._notify();
        }
    };

    setContainer = (container: HTMLElement): void => {
        this.#container = container;
    };

    setConfig = (config: LayoutRenderConfig): void => {
        if (isDeepEqual(config, this.#config)) {
            return;
        }
        const { layoutSize, ...configRest } = config;
        const { layoutSize: currentLayoutSize, ...currentConfigRest } = this.#config;
        let shouldRelayout = true;
        if (isDeepEqual(configRest, currentConfigRest)) {
            if (
                this.#layoutAlgorithm.containerTrigger === "width" &&
                currentLayoutSize.layoutWidth === layoutSize.layoutWidth
            ) {
                shouldRelayout = false;
            } else if (
                this.#layoutAlgorithm.containerTrigger === "height" &&
                currentLayoutSize.layoutHeight === layoutSize.layoutHeight
            ) {
                shouldRelayout = false;
            }
        }
        this.#config = config;
        if (shouldRelayout) {
            this.#syncLayout();
            this._notify();
        }
    };

    getConfig = (): LayoutRenderConfig => {
        return this.#config;
    };

    setLayoutAlgorithm = (layoutAlgorithm: LayoutAlgorithm<T>): void => {
        if (this.#layoutAlgorithm === layoutAlgorithm) {
            return;
        }
        this.#layoutAlgorithm = layoutAlgorithm;
        this.#syncLayout();
        this._notify();
    };

    getLayoutAlgorithm = (): LayoutAlgorithm<T> => {
        return this.#layoutAlgorithm;
    };

    updateItemSize = (id: string, size: Size): void => {
        const item = this.#storeValue.items.find((item) => item.id === id);
        if (!item) {
            return;
        }
        if (isDeepEqual(item.size, size)) {
            return;
        }
        let shouldRelayout = true;
        if (item.size) {
            if (this.#layoutAlgorithm.itemTrigger === "width" && item.size.width === size.width) {
                shouldRelayout = false;
            } else if (this.#layoutAlgorithm.itemTrigger === "height" && item.size.height === size.height) {
                shouldRelayout = false;
            }
        }
        item.size = size;
        const items = [...this.#storeValue.items];
        this.#storeValue = {
            ...this.#storeValue,
            items,
        };
        if (shouldRelayout) {
            this.#syncLayout();
            this._notify();
        }
    };

    addSkipRenderId = (id: string): void => {
        if (this.#skipRenderIds.has(id)) {
            return;
        }
        this.#skipRenderIds.add(id);
        const changed = this.#syncLayoutItems(this.#storeValue.layoutItems);
        if (changed) {
            this._notify();
        }
    };

    removeSkipRenderId = (id: string): void => {
        if (!this.#skipRenderIds.has(id)) {
            return;
        }
        this.#skipRenderIds.delete(id);
        const changed = this.#syncLayoutItems(this.#storeValue.layoutItems);
        if (changed) {
            this._notify();
        }
    };

    clearSkipRenderIds = (): void => {
        if (this.#skipRenderIds.size === 0) {
            return;
        }
        this.#skipRenderIds.clear();
        const changed = this.#syncLayoutItems(this.#storeValue.layoutItems);
        if (changed) {
            this._notify();
        }
    };

    setItems = (items: T[]): void => {
        if (isDeepEqual(items, this.#storeValue.items)) {
            return;
        }
        if (this.#isUpdateItemsPaused) {
            this.#pendingItems = structuredClone(items);
        } else {
            this.#storeValue = {
                ...this.#storeValue,
                items: structuredClone(items),
            };
            this.#syncLayout();
            this._notify();
        }
    };

    setInternalItems = (items: MeasuredLayoutItem<T>[]): void => {
        if (isDeepEqual(items, this.#storeValue.items)) {
            return;
        }
        this.#storeValue = {
            ...this.#storeValue,
            items,
        };
        this.#syncLayout();
        this._notify(true);
    };

    serialize = (): T[] => {
        return this.#serialize(this.#storeValue.layoutItems);
    };

    #syncLayout = (): void => {
        if (!this.#container) {
            return;
        }
        if (this._isPendingNotify()) {
            return;
        }
        const containerBoxMetrics = getContainerBoxMetrics(this.#container);
        const layoutItems = this.#layoutAlgorithm.layout(this.#storeValue.items, this.#config);
        if (containerBoxMetrics.paddingLeft > 0 || containerBoxMetrics.paddingTop > 0) {
            layoutItems.forEach((item) => {
                item.left += containerBoxMetrics.paddingLeft;
                item.top += containerBoxMetrics.paddingTop;
            });
        }
        const containerSize = getContainerSize(containerBoxMetrics, layoutItems);
        this.#syncLayoutItems(layoutItems);
        this.#storeValue = {
            ...this.#storeValue,
            layoutItems,
            containerSize,
        };
    };

    #syncLayoutItems = (layoutItems: RenderItem<MeasuredLayoutItem<T>>[]): boolean => {
        const renderItems = syncLayoutItems(this.#storeValue.renderItems, layoutItems, [...this.#skipRenderIds]);
        if (isDeepEqual(renderItems, this.#storeValue.renderItems)) {
            return false;
        }
        this.#storeValue = {
            ...this.#storeValue,
            renderItems,
        };
        return true;
    };

    #serialize = (layoutItems: RenderItem<MeasuredLayoutItem<T>>[]): T[] => {
        return structuredClone(layoutItems.map((item) => this.#layoutAlgorithm.serialize(item)));
    };

    _beforeBatchOrDelayNotify = (): void => {
        this.#syncLayout();
    };
}

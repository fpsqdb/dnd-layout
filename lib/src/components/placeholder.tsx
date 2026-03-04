import type { LayoutItem } from "../core/types";
import { useWatchPlaceholder } from "../hooks/useWatchPlaceholder";

export type PlaceholderProps<T extends LayoutItem> = {
    placeholderRender?: (item: T) => React.ReactNode;
};

export function Placeholder<T extends LayoutItem>(props: PlaceholderProps<T>) {
    const { placeholderRender } = props;
    const placeholder = useWatchPlaceholder<T>();

    if (!placeholder) {
        return null;
    }

    const defaultPlaceholder = () => {
        return <div className="dnd-layout-placeholder-default-content" />;
    };

    return (
        <div
            className="dnd-layout-placeholder"
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: placeholder.width,
                height: placeholder.height,
                translate: `${placeholder.left}px ${placeholder.top}px 0`,
            }}
        >
            {placeholderRender ? placeholderRender(placeholder.data) : defaultPlaceholder()}
        </div>
    );
}

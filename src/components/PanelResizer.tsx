import { type Component, onCleanup } from "solid-js";

export const PanelResizer: Component<{
  onResize: (delta: number) => void;
  direction: "horizontal" | "vertical";
}> = (props) => {
  let startPos = 0;

  const onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    startPos = props.direction === "horizontal" ? e.clientX : e.clientY;

    const onMouseMove = (e: MouseEvent) => {
      const current = props.direction === "horizontal" ? e.clientX : e.clientY;
      props.onResize(current - startPos);
      startPos = current;
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  onCleanup(() => {
    // cleanup if component unmounts mid-drag
  });

  return (
    <div
      class={`shrink-0 ${props.direction === "horizontal" ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize"} 
        bg-border hover:bg-primary/50 transition-colors active:bg-primary`}
      onMouseDown={onMouseDown}
    />
  );
};

export type PointerMoveHandler = (dx: number, dy: number) => void;
export type PointerLockHandler = (locked: boolean) => void;

export class PointerLock {
  private readonly moveHandlers = new Set<PointerMoveHandler>();
  private readonly lockHandlers = new Set<PointerLockHandler>();

  constructor(private readonly element: HTMLElement) {
    this.element.addEventListener("click", () => this.request());
    document.addEventListener("pointerlockchange", this.handleChange);
    document.addEventListener("mousemove", this.handleMouseMove);
  }

  request(): void {
    if (this.isLocked()) {
      return;
    }
    this.element.requestPointerLock();
  }

  isLocked(): boolean {
    return document.pointerLockElement === this.element;
  }

  onMove(handler: PointerMoveHandler): () => void {
    this.moveHandlers.add(handler);
    return () => this.moveHandlers.delete(handler);
  }

  onChange(handler: PointerLockHandler): () => void {
    this.lockHandlers.add(handler);
    return () => this.lockHandlers.delete(handler);
  }

  dispose(): void {
    document.removeEventListener("pointerlockchange", this.handleChange);
    document.removeEventListener("mousemove", this.handleMouseMove);
    this.moveHandlers.clear();
    this.lockHandlers.clear();
  }

  private handleChange = () => {
    const locked = this.isLocked();
    for (const handler of this.lockHandlers) {
      handler(locked);
    }
  };

  private handleMouseMove = (event: MouseEvent) => {
    if (!this.isLocked()) {
      return;
    }
    for (const handler of this.moveHandlers) {
      handler(event.movementX, event.movementY);
    }
  };
}

import { createVec3, zeroVec3, type Vec3 } from "../utils/Vec3";
import { PointerLock } from "./PointerLock";
import { placeableIds } from "../../data/blocks";

export interface PlayerState {
  position: Vec3;
  velocity: Vec3;
  yaw: number;
  pitch: number;
  eyeHeight: number;
  flying: boolean;
  onGround: boolean;
}

interface ControlsOptions {
  onPreventQuit?: () => void;
}

export class Controls {
  private readonly keys = new Set<string>();
  private readonly lookSensitivity = 0.0025;
  private readonly moveVector = createVec3();
  private readonly removeMoveHandler: () => void;
  private readonly removeLockHandler: () => void;
  private breakRequested = false;
  private placeRequested = false;
  private selectedIndex = 0;
  private placeHeld = false;
  private jumpRequested = false;
  private lastSpacePress = 0;
  private readonly flyToggleWindowMs = 300;

  constructor(
    private readonly pointerLock: PointerLock,
    private readonly state: PlayerState,
    private readonly options: ControlsOptions = {},
  ) {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    document.addEventListener("mousedown", this.handleMouseDown);
    document.addEventListener("mouseup", this.handleMouseUp);
    document.addEventListener("contextmenu", this.handleContextMenu);
    this.removeMoveHandler = this.pointerLock.onMove(this.handleLook);
    this.removeLockHandler = this.pointerLock.onChange(this.handleLockChange);
  }

  dispose(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    document.removeEventListener("mousedown", this.handleMouseDown);
    document.removeEventListener("mouseup", this.handleMouseUp);
    document.removeEventListener("contextmenu", this.handleContextMenu);
    this.removeMoveHandler();
    this.removeLockHandler();
  }

  update(_delta: number): void {
    zeroVec3(this.moveVector);

    if (this.keys.has("KeyW")) this.moveVector.z -= 1;
    if (this.keys.has("KeyS")) this.moveVector.z += 1;
    if (this.keys.has("KeyA")) this.moveVector.x -= 1;
    if (this.keys.has("KeyD")) this.moveVector.x += 1;

    const horizontalLength = Math.hypot(this.moveVector.x, this.moveVector.z);
    if (horizontalLength > 1e-5) {
      const inv = 1 / Math.max(1, horizontalLength);
      this.moveVector.x *= inv;
      this.moveVector.z *= inv;
    }

    if (this.state.flying) {
      if (this.keys.has("Space")) this.moveVector.y += 1;
      if (this.keys.has("ShiftLeft") || this.keys.has("ControlLeft") || this.keys.has("ControlRight")) {
        this.moveVector.y -= 1;
      }
      if (Math.abs(this.moveVector.y) > 1) {
        this.moveVector.y = Math.sign(this.moveVector.y);
      }
    } else {
      this.moveVector.y = 0;
    }
  }

  getState(): PlayerState {
    return this.state;
  }

  getMovementInput(): Vec3 {
    return this.moveVector;
  }

  consumeJumpRequest(): boolean {
    if (this.jumpRequested) {
      this.jumpRequested = false;
      return true;
    }
    return false;
  }

  consumeBreakRequest(): boolean {
    if (this.breakRequested) {
      this.breakRequested = false;
      return true;
    }
    return false;
  }

  consumePlaceRequest(): boolean {
    if (this.placeRequested) {
      this.placeRequested = false;
      return true;
    }
    return false;
  }

  getSelectedBlock(): number {
    return placeableIds[this.selectedIndex] ?? placeableIds[0];
  }

  isPlaceHeld(): boolean {
    return this.placeHeld;
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.code === "KeyW") {
      if (this.pointerLock.isLocked()) {
        event.preventDefault();
        this.options.onPreventQuit?.();
        return;
      }
    }

    if (event.code.startsWith("Digit")) {
      const slot = Number.parseInt(event.code.slice(5), 10) - 1;
      if (!Number.isNaN(slot) && slot >= 0 && slot < placeableIds.length) {
        this.selectedIndex = slot;
      }
    }
    if (event.code === "Space" && event.repeat) {
      return;
    }

    if (event.code === "Space") {
      const now = performance.now();
      if (now - this.lastSpacePress < this.flyToggleWindowMs) {
        this.state.flying = !this.state.flying;
        this.state.velocity.y = 0;
        if (this.state.flying) {
          this.state.onGround = false;
        }
        this.lastSpacePress = 0;
      } else {
        this.lastSpacePress = now;
        if (!this.state.flying) {
          this.jumpRequested = true;
        }
      }
    }
    this.keys.add(event.code);
  };

  private readonly handleKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  private readonly handleMouseDown = (event: MouseEvent) => {
    if (!this.pointerLock.isLocked()) {
      return;
    }
    if (event.button === 0) {
      this.breakRequested = true;
    } else if (event.button === 2) {
      this.placeRequested = true;
      this.placeHeld = true;
    }
  };

  private readonly handleMouseUp = (event: MouseEvent) => {
    if (event.button === 2) {
      this.placeHeld = false;
    }
  };

  private readonly handleLockChange = (locked: boolean) => {
    if (!locked) {
      this.placeHeld = false;
      this.jumpRequested = false;
      this.keys.clear();
      this.lastSpacePress = 0;
    }
  };

  private readonly handleContextMenu = (event: MouseEvent) => {
    if (this.pointerLock.isLocked()) {
      event.preventDefault();
    }
  };

  private readonly handleLook = (dx: number, dy: number) => {
    this.state.yaw -= dx * this.lookSensitivity;
    this.state.pitch -= dy * this.lookSensitivity;

    const limit = Math.PI / 2 - 0.01;
    this.state.pitch = Math.max(-limit, Math.min(limit, this.state.pitch));
  };
}

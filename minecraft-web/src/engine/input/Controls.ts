import {
  addScaledVec3,
  createVec3,
  normalizeVec3,
  setVec3,
  zeroVec3,
  type Vec3,
} from "../utils/Vec3";
import { PointerLock } from "./PointerLock";

export interface PlayerState {
  position: Vec3;
  velocity: Vec3;
  yaw: number;
  pitch: number;
}

export class Controls {
  private readonly keys = new Set<string>();
  private readonly lookSensitivity = 0.002;
  private readonly speed = 8;
  private readonly moveVector = createVec3();
  private readonly forward = createVec3();
  private readonly right = createVec3();
  private readonly direction = createVec3();
  private readonly removeMoveHandler: () => void;

  constructor(private readonly pointerLock: PointerLock, private readonly state: PlayerState) {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    this.removeMoveHandler = this.pointerLock.onMove(this.handleLook);
  }

  dispose(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.removeMoveHandler();
  }

  update(delta: number): void {
    zeroVec3(this.moveVector);

    if (this.keys.has("KeyW")) this.moveVector.z -= 1;
    if (this.keys.has("KeyS")) this.moveVector.z += 1;
    if (this.keys.has("KeyA")) this.moveVector.x -= 1;
    if (this.keys.has("KeyD")) this.moveVector.x += 1;
    if (this.keys.has("Space")) this.moveVector.y += 1;
    if (this.keys.has("ShiftLeft") || this.keys.has("ControlLeft")) this.moveVector.y -= 1;

    if (this.moveVector.x !== 0 || this.moveVector.y !== 0 || this.moveVector.z !== 0) {
      normalizeVec3(this.moveVector);

      setVec3(this.forward, Math.sin(this.state.yaw), 0, Math.cos(this.state.yaw));
      setVec3(this.right, Math.cos(this.state.yaw), 0, -Math.sin(this.state.yaw));

      setVec3(
        this.direction,
        this.forward.x * this.moveVector.z + this.right.x * this.moveVector.x,
        this.moveVector.y,
        this.forward.z * this.moveVector.z + this.right.z * this.moveVector.x,
      );
      normalizeVec3(this.direction);

      const distance = this.speed * delta;
      addScaledVec3(this.state.position, this.direction, distance);
      setVec3(
        this.state.velocity,
        this.direction.x * this.speed,
        this.direction.y * this.speed,
        this.direction.z * this.speed,
      );
    } else {
      setVec3(this.state.velocity, 0, 0, 0);
    }
  }

  getState(): PlayerState {
    return this.state;
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    this.keys.add(event.code);
  };

  private readonly handleKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  private readonly handleLook = (dx: number, dy: number) => {
    this.state.yaw -= dx * this.lookSensitivity;
    this.state.pitch -= dy * this.lookSensitivity;

    const limit = Math.PI / 2 - 0.01;
    this.state.pitch = Math.max(-limit, Math.min(limit, this.state.pitch));
  };
}

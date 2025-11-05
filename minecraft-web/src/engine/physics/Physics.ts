import { isCollidable } from "../../data/blocks";
import type { Controls, PlayerState } from "../input/Controls";
import type { World } from "../world/World";

const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.3;
const GRAVITY = -32;
const JUMP_VELOCITY = 8.5;
const WALK_SPEED = 4.6;
const FLY_SPEED = 10;
const MAX_FALL_SPEED = -60;
const EPSILON = 1e-4;

interface CollisionCell {
  x: number;
  y: number;
  z: number;
}

export class Physics {
  constructor(private readonly world: World) {}

  step(player: PlayerState, controls: Controls, delta: number): void {
    if (delta <= 0) {
      return;
    }

    const input = controls.getMovementInput();
    const yaw = player.yaw;
    const sinYaw = Math.sin(yaw);
    const cosYaw = Math.cos(yaw);

    const forwardX = sinYaw;
    const forwardZ = cosYaw;
    const rightX = cosYaw;
    const rightZ = -sinYaw;

    const desiredX = rightX * input.x + forwardX * input.z;
    const desiredZ = rightZ * input.x + forwardZ * input.z;
    const speed = player.flying ? FLY_SPEED : WALK_SPEED;

    if (Math.abs(desiredX) > 1e-5 || Math.abs(desiredZ) > 1e-5) {
      player.velocity.x = desiredX * speed;
      player.velocity.z = desiredZ * speed;
    } else {
      player.velocity.x = 0;
      player.velocity.z = 0;
    }

    const wasOnGround = player.onGround;
    player.onGround = false;

    if (player.flying) {
      player.velocity.y = input.y * FLY_SPEED;
    } else {
      if (controls.consumeJumpRequest() && wasOnGround) {
        player.velocity.y = JUMP_VELOCITY;
      } else {
        player.velocity.y += GRAVITY * delta;
        if (player.velocity.y < MAX_FALL_SPEED) {
          player.velocity.y = MAX_FALL_SPEED;
        }
      }
    }

    this.moveHorizontal(player, player.velocity.x * delta, 0);
    this.moveVertical(player, player.velocity.y * delta);
    this.moveHorizontal(player, player.velocity.z * delta, 2);
  }

  private moveHorizontal(player: PlayerState, amount: number, axis: 0 | 2): void {
    if (Math.abs(amount) < EPSILON) {
      return;
    }

    const position = player.position;
    const newCoord = (axis === 0 ? position.x : position.z) + amount;
    const minX = axis === 0 ? newCoord - PLAYER_RADIUS : position.x - PLAYER_RADIUS;
    const maxX = axis === 0 ? newCoord + PLAYER_RADIUS : position.x + PLAYER_RADIUS;
    const minZ = axis === 2 ? newCoord - PLAYER_RADIUS : position.z - PLAYER_RADIUS;
    const maxZ = axis === 2 ? newCoord + PLAYER_RADIUS : position.z + PLAYER_RADIUS;
    const minY = position.y;
    const maxY = position.y + PLAYER_HEIGHT;

    const collisions = this.collectCollisions(minX, minY, minZ, maxX, maxY, maxZ);

    if (collisions.length === 0) {
      if (axis === 0) {
        position.x = newCoord;
      } else {
        position.z = newCoord;
      }
      return;
    }

    if (amount > 0) {
      let allowed = newCoord;
      for (const cell of collisions) {
        const boundary = (axis === 0 ? cell.x : cell.z) - PLAYER_RADIUS - EPSILON;
        if (boundary < allowed) {
          allowed = boundary;
        }
      }
      const clamped = Math.min(newCoord, allowed);
      if (axis === 0) {
        position.x = clamped;
        if (clamped !== newCoord) {
          player.velocity.x = 0;
        }
      } else {
        position.z = clamped;
        if (clamped !== newCoord) {
          player.velocity.z = 0;
        }
      }
    } else {
      let allowed = newCoord;
      for (const cell of collisions) {
        const boundary = (axis === 0 ? cell.x : cell.z) + 1 + PLAYER_RADIUS + EPSILON;
        if (boundary > allowed) {
          allowed = boundary;
        }
      }
      const clamped = Math.max(newCoord, allowed);
      if (axis === 0) {
        position.x = clamped;
        if (clamped !== newCoord) {
          player.velocity.x = 0;
        }
      } else {
        position.z = clamped;
        if (clamped !== newCoord) {
          player.velocity.z = 0;
        }
      }
    }
  }

  private moveVertical(player: PlayerState, amount: number): void {
    if (Math.abs(amount) < EPSILON) {
      return;
    }

    const position = player.position;
    const newY = position.y + amount;
    const minX = position.x - PLAYER_RADIUS;
    const maxX = position.x + PLAYER_RADIUS;
    const minZ = position.z - PLAYER_RADIUS;
    const maxZ = position.z + PLAYER_RADIUS;
    const collisions = this.collectCollisions(minX, newY, minZ, maxX, newY + PLAYER_HEIGHT, maxZ);

    if (collisions.length === 0) {
      position.y = newY;
      return;
    }

    if (amount > 0) {
      let allowed = newY;
      for (const cell of collisions) {
        const boundary = cell.y - PLAYER_HEIGHT - EPSILON;
        if (boundary < allowed) {
          allowed = boundary;
        }
      }
      const clamped = Math.min(newY, allowed);
      position.y = clamped;
      if (clamped !== newY) {
        player.velocity.y = 0;
      }
    } else {
      let allowed = newY;
      for (const cell of collisions) {
        const boundary = cell.y + 1 + EPSILON;
        if (boundary > allowed) {
          allowed = boundary;
        }
      }
      const clamped = Math.max(newY, allowed);
      position.y = clamped;
      if (clamped !== newY) {
        player.velocity.y = 0;
        player.onGround = true;
      }
    }
  }

  private collectCollisions(
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number,
  ): CollisionCell[] {
    const cells: CollisionCell[] = [];
    let x0 = Math.floor(minX);
    let x1 = Math.floor(maxX - EPSILON);
    let y0 = Math.floor(minY);
    let y1 = Math.floor(maxY - EPSILON);
    let z0 = Math.floor(minZ);
    let z1 = Math.floor(maxZ - EPSILON);

    if (x1 < x0) x1 = x0;
    if (y1 < y0) y1 = y0;
    if (z1 < z0) z1 = z0;

    for (let x = x0; x <= x1; x += 1) {
      for (let y = y0; y <= y1; y += 1) {
        for (let z = z0; z <= z1; z += 1) {
          if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
            continue;
          }
          const id = this.world.getBlock(x, y, z);
          if (isCollidable(id)) {
            cells.push({ x, y, z });
          }
        }
      }
    }
    return cells;
  }
}
